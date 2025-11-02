import json
from typing import Dict, Optional, Any

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from pathlib import Path

from app.models.evaluation import (
    AnswerEvaluationRequest,
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)
from app.services.memory_logger import log_evaluation
from app.utils.extract_evaluation import extract_evaluation

PROMPT_PATH: Path = (PROMPT_BASE_DIR / "evaluation_prompt.txt").resolve()

SESSION_PROMPT_PATH: Path = (PROMPT_BASE_DIR / "session_evaluation_prompt.txt").resolve()
    
    
class EvaluationService:
    def __init__(self):
        pass

    def evaluate_answer(
        self, 
        req: AnswerEvaluationRequest = None, 
        memory: Optional[ConversationBufferMemory] = None
    ) -> AnswerEvaluationResult:
        """
        사용자의 개별 답변을 LLM을 사용하여 평가하고, 그 결과를 메모리에 로깅합니다.
        """
        raw_prompt = load_prompt_template(self.PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        category_for_prompt = "tailored" if req.use_tailored_category else req.category
        
        # 타입 힌트 개선: Dict[str, Any]를 사용하여 union type 대신 깔끔하게 정리
        vars: Dict[str, Any] = {
            "question_id": req.question_id,
            "category": category_for_prompt,
            "criteria_csv": (", ".join(req.criteria) if req.criteria else ""),
            "skills_csv": (", ".join(req.skills) if req.skills else ""),
            "question_text": req.question_text,
            "user_answer": req.user_answer,
            "answer_duration_sec": req.answer_duration_sec,
            "remaining_time_sec": req.remaining_time_sec if req.remaining_time_sec is not None else "null",
            "remaining_main_questions": req.remaining_main_questions if req.remaining_main_questions is not None else "null"
        }

        prompt_text = prompt_template.format(**vars)
        content = groq_chat(
            prompt_text, 
            max_tokens=2048
        )
        json_text = strip_json(content)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM 평가 응답이 JSON 형식이 아닙니다: {e}")

        eval_result = AnswerEvaluationResult.model_validate(parsed)
        if memory is not None:
            log_evaluation(memory, eval_result.model_dump())

        return eval_result


    def evaluate_session(
        self, 
        memory: ConversationBufferMemory
    ) -> SessionEvaluationResult:

        avg_score, conversation_text = extract_evaluation(memory)

        raw_prompt = load_prompt_template(self.SESSION_PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        vars = {
            "conversation": conversation_text, 
            "avg_score": avg_score
        }
        
        prompt_text = prompt_template.format(**vars)
        content = groq_chat(
            prompt_text, 
            max_tokens=2048
        )
        json_text = strip_json(content)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM 세션 평가 응답이 JSON 형식이 아닙니다: {e}")

        parsed["average_score"] = float(avg_score)
        
        eval_result = SessionEvaluationResult.model_validate(parsed)
        if memory is not None:
            log_evaluation(memory, eval_result.model_dump())

        return eval_result
