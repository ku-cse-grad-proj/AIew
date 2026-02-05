import json
from typing import Any, Dict, List

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import PromptTemplate

from app.models.event_types import EventType
from app.models.followup import FollowupRequest, FollowupResponse
from app.services.memory_logger import MemoryLogger
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)

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
                # 타입과 필드로 명확하게 판단
                if (
                    event.get("type") == EventType.QUESTION_ASKED
                    and event.get("data", {}).get("parentQuestionId") == parent_qid
                ):
                    cnt += 1
            except (json.JSONDecodeError, AttributeError):
                continue
        return cnt

    def _preprocess_parsed(self, item: Dict[str, Any]) -> Dict[str, Any]:
        key_time = "expectedAnswerTimeSec"
        value = item.get(key_time)
        if (
            value is None
            or (isinstance(value, str) and value.lower() in ("", "null", "none"))
            or not isinstance(value, (int, float))
        ):
            item[key_time] = 180
        else:
            time = int(round(value))
            item[key_time] = max(15, min(180, time))

        key_criteria = "focusCriteria"
        value = item.get(key_criteria)
        if not isinstance(value, List):
            item[key_criteria] = ["N/A"]  # default value
        elif not all(isinstance(v, str) for v in value):
            cleaned_list = [
                str(v).strip() for v in value if v is not None and str(v).strip()
            ]
            item[key_criteria] = cleaned_list
            if not cleaned_list:
                item[key_criteria] = ["N/A"]
        elif not value:
            item[key_criteria] = ["N/A"]

        for key in ["followupId", "parentQuestionId", "rationale"]:
            value = item.get(key)
            if not isinstance(value, str) or value.lower() in ("", "null", "none"):
                item[key] = ""

        question_keys = ["questionText", "question"]
        found_question = False

        for q_key in question_keys:
            value = item.get(q_key)
            if (
                isinstance(value, str)
                and value.strip()
                and value.lower() not in ("null", "none")
            ):
                item["questionText"] = value.strip()
                item["question"] = value.strip()
                found_question = True
                break
        if not found_question:
            item["questionText"] = ""
            item["question"] = ""

        return item

    def _normalize_items(
        self,
        parsed_item: Dict[str, Any],
        req: FollowupRequest,
    ) -> Dict[str, Any]:
        if req.autoSequence:
            existing = self._count_existing_followups(req.questionId)
            idx = existing + 1
        else:
            idx = req.nextFollowupIndex or 1

        out = {
            "followupId": f"{req.questionId}-fu{idx}",
            "parentQuestionId": parsed_item.get("parentQuestionId", ""),
            "focusCriteria": parsed_item.get("focusCriteria", []),
            "rationale": parsed_item.get("rationale", ""),
            "question": parsed_item.get("questionText", "")
            or parsed_item.get("question"),
            "expectedAnswerTimeSec": parsed_item.get("expectedAnswerTimeSec", 180),
        }

        return out

    def generate_followups(
        self,
        req: FollowupRequest,
    ) -> FollowupResponse:
        raw_prompt = load_prompt_template(PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        vars = {
            "question_id": req.questionId,
            "category": req.category,
            "question_text": req.questionText,
            "criteria_csv": ", ".join(req.criteria) if req.criteria else "",
            "skills_csv": ", ".join(req.skills) if req.skills else "",
            "user_answer": req.userAnswer,
            "evaluation_summary": req.evaluationSummary or "",
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
            raise ValueError(
                f"LLM 꼬리질문 응답이 JSON 형식이 아닙니다. 오류: \n Raw JSON: {json_text}"
            )

        parsed = self._preprocess_parsed(parsed)
        norm = self._normalize_items(parsed, req)
        followup = FollowupResponse.model_validate(norm)

        # 로깅은 core-api에서 /log/question-asked 호출로 처리
        return followup
