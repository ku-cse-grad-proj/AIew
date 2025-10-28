import json
from typing import (
    Any,
    Dict, 
    List,
    Field
)

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.question import (
    UserInfo, 
    QuestionConstraints,
    QuestionResponse
)
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)
from app.services.memory_logger import log_main_questions

PROMPT_PATH = (PROMPT_BASE_DIR / "question_prompt.txt").resolve()


class QuestionGeneratorService:
    def __init__(
        self,
        memory: ConversationBufferMemory = None,
        session_id: str = "",
    ):
        
        self.memory = memory
        self.session_id = session_id
    
    def _normalize_items(
        self,
        items: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        
        out: List[Dict[str, Any]] = []
        for i, q in enumerate(items[:5], start=1):
            out.append(
                {
                    "main_question_id": f"q{i}",
                    "category": q.get("category"),
                    "criteria": q.get("criteria"),
                    "skills": q.get("skills", []),
                    "rationale": q.get("rationale"),
                    "question_text": q.get("question_text"),
                    "estimated_answer_time_sec": q.get("estimated_answer_time_sec"),
                }
            )
        return out

    def _dedupe_and_enforce(
        self,
        items: List[Dict[str, Any]] = [], 
        avoid_ids: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        
        out = []
        for q in items:
            if q["main_question_id"] in avoid_ids:
                continue
            out.append(q)
        return out[:5]


    def generate_questions(
        self,
        user_info: UserInfo = Field(...),
        constraints: QuestionConstraints = Field(...),
        memory: ConversationBufferMemory = None,
    ) -> List[Dict[str, Any]]:
        
        raw = load_prompt_template(PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw)

        vars = {
            "desired_role": user_info.desired_role,
            "company": user_info.company,
            "core_values": user_info.core_values,
            "resume_text": user_info.resume_text,
            "portfolio_text": user_info.portfolio_text,
            "language": constraints.language,
            "timebox_total_sec": constraints.timebox_total_sec,
            "avoid_ids_csv": ", ".join(constraints.avoid_question_ids) if constraints.avoid_question_ids else "none",
            "seed": constraints.seed if constraints.seed is not None else "null"
        }

        prompt_text = prompt_template.format(**vars)
        content = groq_chat(
            prompt_text, 
            max_tokens=2048, 
        )
        json_text = strip_json(content)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError:
            raise ValueError(f"LLM 질문 생성 응답이 JSON 형식이 아닙니다.\n Raw JSON: {json_text}")
        
        items = (
            parsed["main_questions"]
            if isinstance(parsed, dict) and "main_questions" in parsed
            else parsed
        )
        if not isinstance(items, list):
            raise ValueError("Parsed content is not a list of questions.")

        norm = self._normalize_items(items)
        final = self._dedupe_and_enforce(
            norm, 
            constraints.avoid_question_ids
        )

        _ = [QuestionResponse.model_validate(i) for i in final]
        log_main_questions(memory, final)

        return final
