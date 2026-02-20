from typing import Any, Dict, List, Optional, cast

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig

from app.models.evaluation import (
    AnswerEvaluationRequest,
    AnswerEvaluationResult,
    SessionEvaluationResult,
    SessionFeedbackOutput,
)
from app.services.memory_logger import MemoryLogger
from app.utils.extract_evaluation import extract_evaluation
from app.utils.llm_utils import PROMPT_BASE_DIR, llm, load_prompt_template

PROMPT_PATH = (PROMPT_BASE_DIR / "evaluation_prompt.txt").resolve()
SESSION_PROMPT_PATH = (PROMPT_BASE_DIR / "session_evaluation_prompt.txt").resolve()


class EvaluationService:
    def __init__(self, memory: BaseChatMessageHistory, session_id: str = ""):
        self.memory = memory
        self.session_id = session_id
        self.logger = MemoryLogger(memory=memory, session_id=session_id)

    @staticmethod
    def _is_truly_empty_answer(answer: Optional[str]) -> bool:
        """
        '답변 누락'으로 강제 평가해야 하는지 여부를 판단하는 헬퍼.

        - 완전 공백 / None
        - '없습니다', '모르겠습니다', '잘 모르겠습니다', '기억이 나지 않습니다' 등
          실질적인 내용을 전혀 담지 않는 표현 포함 시 True
        """
        if answer is None or answer.strip() == "" or len(answer.strip()) < 15:
            return True

        # 공백 정리
        normalized = " ".join(answer.split())
        if not normalized:
            return True

        lowered = normalized.lower()

        # '내용이 없다'고 간주할 표현 목록 (필요하면 더 추가 가능)
        trivial_phrases = [
            "없습니다",
            "모릅니다",
            "모르겠습니다",
            "잘 모르겠습니다",
            "기억이 나지 않습니다",
            "생각이 나지 않습니다",
            "i don't know",
            "dont know",
        ]

        for phrase in trivial_phrases:
            if phrase.lower() in lowered:
                return True

        return False

    @staticmethod
    def _build_forced_empty_result(
        req: AnswerEvaluationRequest,
    ) -> Dict[str, Any]:
        """
        userAnswer가 사실상 '답변 누락'인 경우, LLM을 호출하지 않고
        규칙에 따라 강제 평가 결과를 생성하는 헬퍼.
        """
        reason_msg = "답변이 없어 평가할 근거가 부족했습니다."
        if req.criteria:
            criterion_scores: List[Dict[str, Any]] = [
                {
                    "name": "평가 불가",
                    "reason": reason_msg,
                    "score": 1,
                }
                for _ in req.criteria
            ]
        else:
            criterion_scores = [
                {
                    "name": "평가 불가",
                    "reason": reason_msg,
                    "score": 1,
                }
            ]

        feedback_text = (
            "지원자님의 답변이 명시적으로 제시되지 않아 해당 질문을 통해 역량을 판단할 수 없었습니다. "
            "핵심 질문에 대한 구체적인 경험이나 지식을 다음 답변에서 제시해 주시면 좋겠습니다. "
            "이 질문에 대해 후속 질문으로 다시 확인하겠습니다."
        )

        tail_rationale_text = "답변이 완전히 누락되어 지원자의 관련 역량 및 경험을 검증할 수 있는 근거가 전혀 없습니다."

        forced: Dict[str, Any] = {
            "aiQuestionId": req.aiQuestionId,
            "type": req.type,
            "answerDurationSec": req.answerDurationSec,
            "strengths": ["답변을 통해 확인된 강점 없음"],
            "improvements": [
                "핵심 질문에 대한 답변 제시 필요",
                "질문 관련 역량 및 경험 제시 필요",
            ],
            "redFlags": ["핵심 질문에 대한 답변 누락"],
            "criterionScores": criterion_scores,
            "feedback": feedback_text,
            "overallScore": 1,
            "tailRationale": tail_rationale_text,
            "tailDecision": "create",
        }

        return forced

    def evaluate_answer(
        self,
        req: AnswerEvaluationRequest,
        run_config: Optional[RunnableConfig] = None,
    ) -> AnswerEvaluationResult:
        # 0. '답변 누락 / 실질적 내용 없음' 예외 처리 → LLM 호출 생략
        if self._is_truly_empty_answer(req.answer):
            forced = self._build_forced_empty_result(req)
            eval_result = AnswerEvaluationResult.model_validate(forced)
            self.logger.log_answer_evaluated(eval_result.model_dump())
            return eval_result

        # 1. 정상 케이스 → LCEL 체인
        raw_prompt = load_prompt_template(PROMPT_PATH)

        chain = ChatPromptTemplate.from_messages(
            [("human", raw_prompt)]
        ) | llm.with_structured_output(AnswerEvaluationResult, method="json_mode")

        vars: Dict[str, Any] = {
            "ai_question_id": req.aiQuestionId,
            "type": req.type,
            "criteria_csv": (", ".join(req.criteria) if req.criteria else ""),
            "skills_csv": (", ".join(req.skills) if req.skills else ""),
            "question_text": req.question,
            "user_answer": req.answer,
            "answer_duration_sec": req.answerDurationSec,
        }

        eval_result = cast(
            AnswerEvaluationResult, chain.invoke(vars, config=run_config or {})
        )
        self.logger.log_answer_evaluated(eval_result.model_dump())

        return eval_result

    def evaluate_session(
        self,
        run_config: Optional[RunnableConfig] = None,
    ) -> SessionEvaluationResult:
        avg_score, conversation_text = extract_evaluation(self.memory)

        raw_prompt = load_prompt_template(SESSION_PROMPT_PATH)

        chain = ChatPromptTemplate.from_messages(
            [("human", raw_prompt)]
        ) | llm.with_structured_output(SessionFeedbackOutput, method="json_mode")

        vars: Dict[str, Any] = {
            "conversation": conversation_text,
            "avg_score": avg_score,
        }

        result = cast(
            SessionFeedbackOutput, chain.invoke(vars, config=run_config or {})
        )

        float_avg_score = max(1.0, min(5.0, float(avg_score)))
        return SessionEvaluationResult.model_validate(
            {
                "averageScore": float_avg_score,
                "sessionFeedback": result.sessionFeedback,
            }
        )
