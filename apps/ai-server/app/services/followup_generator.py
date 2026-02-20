import json
from typing import Any, Dict, Optional, cast

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig

from app.models.event_types import EventType
from app.models.followup import FollowupRequest, FollowupResponse
from app.services.memory_logger import MemoryLogger
from app.utils.llm_utils import PROMPT_BASE_DIR, llm, load_prompt_template

PROMPT_PATH = (PROMPT_BASE_DIR / "followup_prompt.txt").resolve()


class FollowupGeneratorService:
    def __init__(
        self,
        memory: BaseChatMessageHistory,
        session_id: str = "",
    ):
        self.memory = memory
        self.session_id = session_id
        self.logger = MemoryLogger(memory=memory, session_id=session_id)

    def _count_existing_followups(self, parent_qid: str = "") -> int:
        """타입 필드 기반 꼬리질문 카운팅"""
        messages = self.memory.messages
        if not messages:
            return 0
        cnt = 0
        for m in messages:
            content = str(getattr(m, "content", ""))
            try:
                event = json.loads(content)
                if (
                    event.get("type") == EventType.QUESTION_ASKED
                    and event.get("data", {}).get("parentQuestionId") == parent_qid
                ):
                    cnt += 1
            except (json.JSONDecodeError, AttributeError):
                continue
        return cnt

    def _normalize_items(
        self,
        parsed: FollowupResponse,
        req: FollowupRequest,
    ) -> Dict[str, Any]:
        if req.autoSequence:
            existing = self._count_existing_followups(req.aiQuestionId)
            idx = existing + 1
        else:
            idx = req.nextFollowupIndex or 1

        return {
            "followupId": f"{req.aiQuestionId}-fu{idx}",
            "parentQuestionId": parsed.parentQuestionId,
            "focusCriteria": parsed.focusCriteria,
            "rationale": parsed.rationale,
            "question": parsed.question,
            "expectedAnswerTimeSec": parsed.expectedAnswerTimeSec,
        }

    def generate_followups(
        self,
        req: FollowupRequest,
        run_config: Optional[RunnableConfig] = None,
    ) -> FollowupResponse:
        raw_prompt = load_prompt_template(PROMPT_PATH)

        chain = ChatPromptTemplate.from_messages(
            [("human", raw_prompt)]
        ) | llm.with_structured_output(FollowupResponse, method="json_mode")

        vars: Dict[str, Any] = {
            "ai_question_id": req.aiQuestionId,
            "type": req.type,
            "question_text": req.question,
            "criteria_csv": ", ".join(req.criteria) if req.criteria else "",
            "skills_csv": ", ".join(req.skills) if req.skills else "",
            "user_answer": req.answer,
            "evaluation_summary": req.evaluationSummary or "",
        }

        result = cast(FollowupResponse, chain.invoke(vars, config=run_config or {}))

        norm = self._normalize_items(result, req)
        return FollowupResponse.model_validate(norm)
