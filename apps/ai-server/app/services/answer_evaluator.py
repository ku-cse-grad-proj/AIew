import json
from typing import Any, Dict, List, Optional

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.evaluation import (
    AnswerEvaluationRequest,
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.services.memory_logger import MemoryLogger
from app.utils.extract_evaluation import extract_evaluation
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)

PROMPT_PATH = (PROMPT_BASE_DIR / "evaluation_prompt.txt").resolve()
SESSION_PROMPT_PATH = (PROMPT_BASE_DIR / "session_evaluation_prompt.txt").resolve()


class EvaluationService:
    def __init__(self, memory: ConversationBufferMemory = None, session_id: str = ""):
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
        if answer.strip() == "" or len(answer.strip()) < 15:
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
        user_answer가 사실상 '답변 누락'인 경우, LLM을 호출하지 않고
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
            "question_id": req.question_id,
            "category": req.category,
            "answer_duration_sec": req.answer_duration_sec,
            "strengths": ["답변을 통해 확인된 강점 없음"],
            "improvements": [
                "핵심 질문에 대한 답변 제시 필요",
                "질문 관련 역량 및 경험 제시 필요",
            ],
            "red_flags": ["핵심 질문에 대한 답변 누락"],
            "criterion_scores": criterion_scores,
            "feedback": feedback_text,
            "overall_score": 1,
            "tail_rationale": tail_rationale_text,
            "tail_decision": "create",
        }

        return forced

    def _preprocess_parsed_answer(self, item: Dict[str, Any]) -> Dict[str, Any]:
        key = "overall_score"
        value = item.get(key)
        if (
            value is None
            or (isinstance(value, str) and value.lower() in ("", "none", "null"))
            or not isinstance(value, (int, float))
        ):
            item[key] = 3
        else:
            score = int(round(value))
            item[key] = max(1, min(5, score))

        key = "answer_duration_sec"
        value = item.get(key)
        if (
            value is None
            or (isinstance(value, str) and value.lower() in ("", "none", "null"))
            or not isinstance(value, (int, float))
        ):
            item[key] = 180
        else:
            duration = int(round(value))
            item[key] = max(0, duration)

        key = "criterion_scores"
        if not isinstance(item.get(key), List):
            item[key] = ["N/A"]  # default value

        cleaned_scores = []
        for score_item in item[key]:
            if not isinstance(score_item, Dict):
                continue

            score = score_item.get("score")
            if score is None or (
                isinstance(score, str) and score.lower() in ("", "none", "null")
            ):
                score_item["score"] = 1
            elif isinstance(score, (int, float)):
                score_item["score"] = max(1, min(5, int(round(score))))
            else:
                score_item["score"] = 1

            for sub_key in ["name", "reason"]:
                sub_value = score_item.get(sub_key)
                if not isinstance(sub_value, str) or sub_value.lower() in (
                    "",
                    "none",
                    "null",
                ):
                    score_item[sub_key] = ""

            if score_item.get("name") and score_item.get("reason"):
                cleaned_scores.append(score_item)

        item[key] = cleaned_scores

        for key in ["strengths", "improvements", "red_flags"]:
            value = item.get(key)
            if not isinstance(value, List):
                item[key] = ["N/A"]  # default values
            elif not all(isinstance(v, str) for v in value):
                cleaned_list = [str(v) for v in value if v is not None][:5]
                item[key] = cleaned_list
                if not cleaned_list:
                    item[key] = ["N/A"]
            elif not value:
                item[key] = ["N/A"]

        for key in ["question_id", "category", "feedback"]:
            value = item.get(key)
            if not isinstance(value, str) or value.lower() in ("", "none", "null"):
                item[key] = ""
            elif key == "category":
                item[key] = item[key].lower()

        key = "tail_rationale"
        tail_decision = item.get("tail_decision", "").strip().lower()
        if tail_decision not in ("create", "skip"):
            item["tail_decision"] = "skip"
        else:
            item["tail_decision"] = tail_decision

        return item

    def _preprocess_parsed_session(
        self, item: Dict[str, Any], avg_score: float
    ) -> Dict[str, Any]:
        key_avg = "average_score"
        item[key_avg] = max(1.0, min(5.0, avg_score))

        key_feedback = "session_feedback"
        value = item.get(key_feedback)
        if not isinstance(value, str) or value.lower() in ("", "none", "null"):
            item[key_feedback] = ""

        return item

    def evaluate_answer(
        self,
        req: AnswerEvaluationRequest = ...,
        memory: Optional[ConversationBufferMemory] = ...,
    ) -> AnswerEvaluationResult:
        # 0. '답변 누락 / 실질적 내용 없음' 예외 처리 → LLM 호출 생략
        if self._is_truly_empty_answer(req.user_answer):
            forced = self._build_forced_empty_result(req)
            forced = self._preprocess_parsed_answer(forced)
            eval_result = AnswerEvaluationResult.model_validate(forced)
            self.logger.log_evaluation(eval_result.model_dump())
            return eval_result

        # 1. 정상 케이스 → LLM 프롬프트 구성 및 호출
        raw_prompt = load_prompt_template(PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        category_for_prompt = "tailored" if req.use_tailored_category else req.category

        vars: Dict[str, Any] = {
            "question_id": req.question_id,
            "category": category_for_prompt,
            "criteria_csv": (", ".join(req.criteria) if req.criteria else ""),
            "skills_csv": (", ".join(req.skills) if req.skills else ""),
            "question_text": req.question_text,
            "user_answer": req.user_answer,
            "answer_duration_sec": req.answer_duration_sec,
            "remaining_time_sec": req.remaining_time_sec
            if req.remaining_time_sec is not None
            else "null",
            "remaining_main_questions": req.remaining_main_questions
            if req.remaining_main_questions is not None
            else "null",
        }

        prompt_text = prompt_template.format(**vars)
        content = groq_chat(prompt_text, max_tokens=2048)
        json_text = strip_json(content)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError:
            raise ValueError(
                f"LLM 평가 응답이 JSON 형식이 아닙니다.\n Raw JSON: {json_text}"
            )

        parsed = self._preprocess_parsed_answer(parsed)
        eval_result = AnswerEvaluationResult.model_validate(parsed)
        self.logger.log_evaluation(eval_result.model_dump())

        return eval_result

    def evaluate_session(
        self, memory: ConversationBufferMemory
    ) -> SessionEvaluationResult:
        avg_score, conversation_text = extract_evaluation(memory)

        raw_prompt = load_prompt_template(SESSION_PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        vars = {"conversation": conversation_text, "avg_score": avg_score}

        prompt_text = prompt_template.format(**vars)
        content = groq_chat(prompt_text, max_tokens=2048)
        json_text = strip_json(content)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError:
            raise ValueError(
                f"LLM 세션 평가 응답이 JSON 형식이 아닙니다.\n Raw JSON: {json_text}"
            )

        float_avg_score = float(avg_score)
        parsed = self._preprocess_parsed_session(parsed, float_avg_score)
        eval_result = SessionEvaluationResult.model_validate(parsed)
        self.logger.log_evaluation(eval_result.model_dump())

        return eval_result
