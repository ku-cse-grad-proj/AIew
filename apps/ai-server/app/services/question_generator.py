from typing import Any, Dict, List, Optional, cast

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig

from app.models.question import (
    QuestionConstraints,
    QuestionListOutput,
    QuestionResponse,
    UserInfo,
)
from app.services.memory_logger import MemoryLogger
from app.utils.llm_utils import PROMPT_BASE_DIR, llm, load_prompt_template

PROMPT_PATH = (PROMPT_BASE_DIR / "question_prompt.txt").resolve()


class QuestionGeneratorService:
    def __init__(
        self,
        memory: BaseChatMessageHistory,
        session_id: str = "",
    ):
        self.memory = memory
        self.session_id = session_id
        self.logger = MemoryLogger(memory=memory, session_id=session_id)

    def _normalize_items(
        self,
        items: List[QuestionResponse],
    ) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for i, q in enumerate(items[:5], start=1):
            out.append(
                {
                    "main_question_id": f"q{i}",
                    "category": q.category,
                    "criteria": q.criteria,
                    "skills": q.skills,
                    "rationale": q.rationale,
                    "question": q.question,
                    "estimated_answer_time_sec": q.estimated_answer_time_sec,
                }
            )
        return out

    def _dedupe_and_enforce(
        self, items: List[Dict[str, Any]] = [], avoid_ids: List[str] = []
    ) -> List[Dict[str, Any]]:
        out = []
        for q in items:
            if q["main_question_id"] in avoid_ids:
                continue
            out.append(q)
        return out[:5]

    def generate_questions(
        self,
        user_info: UserInfo,
        constraints: QuestionConstraints,
        run_config: Optional[RunnableConfig] = None,
    ) -> List[QuestionResponse]:
        raw = load_prompt_template(PROMPT_PATH)

        chain = ChatPromptTemplate.from_messages(
            [("human", raw)]
        ) | llm.with_structured_output(QuestionListOutput, method="json_mode")

        vars: Dict[str, Any] = {
            "desired_role": user_info.desired_role,
            "company": user_info.company,
            "core_values": user_info.core_values,
            "resume_text": user_info.resume_text,
            "portfolio_text": user_info.portfolio_text,
            "language": constraints.language,
            "timebox_total_sec": constraints.timebox_total_sec,
            "avoid_ids_csv": ", ".join(constraints.avoid_question_ids)
            if constraints.avoid_question_ids
            else "none",
            "seed": constraints.seed if constraints.seed is not None else "null",
        }

        result = cast(QuestionListOutput, chain.invoke(vars, config=run_config or {}))

        norm = self._normalize_items(result.main_questions)
        final = self._dedupe_and_enforce(norm, constraints.avoid_question_ids)

        return [QuestionResponse.model_validate(i) for i in final]
