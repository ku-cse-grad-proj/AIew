import json
from typing import (
    Any,
    Dict, 
    Optional,
    List
)

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.followup import (
    FollowupRequest,
    FollowupResponse
)
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)
from app.services.memory_logger import log_tail_question

PROMPT_PATH = (PROMPT_BASE_DIR / "followup_prompt.txt").resolve()


class FollowupGeneratorService:
    def __init__(
        self,
        memory: Optional[ConversationBufferMemory] = None,
        session_id: str = "",
    ):
        
        self.memory = memory
        self.session_id = session_id
        
    def _count_existing_followups(
        self,
        memory: Optional[ConversationBufferMemory] = None, 
        parent_qid: str = ""
    ) -> int:
        
        if memory is None:
            return 0
        msgs = getattr(memory, "chat_memory", None)
        if not msgs or not getattr(msgs, "messages", None):
            return 0
        cnt = 0
        for m in msgs.messages:
            content = str(getattr(m, "content", ""))
            if (
                '"parent_question_id"' in content
                and f'"{parent_qid}"' in content
                and '"followup_id"' in content
            ):
                cnt += 1
        return cnt

    def _normalize_items(
        self,
        parsed_item: Dict[str, Any], 
        req: FollowupRequest,
        memory: Optional[ConversationBufferMemory] = None
    ) -> Dict[str, Any]:

        if req.auto_sequence:
            existing = self._count_existing_followups(
                memory, 
                req.question_id
            )
            idx = existing + 1
        else:
            idx = req.next_followup_index or 1
        
        out = {
            "followup_id": f"{req.question_id}-fu{idx}",
            "parent_question_id": parsed_item.get("question_id", ""),            
            "focus_criteria": parsed_item.get("focus_criteria", []),
            "rationale": parsed_item.get("rationale", ""),
            "question_text": parsed_item.get("question_text", ""), 
            "expected_answer_time_sec": parsed_item.get("expected_answer_time_sec", 180),
        }
        
        return out

    def generate_followups(
        self,
        req: FollowupRequest = ..., 
        memory: Optional[ConversationBufferMemory] = ...
    ) -> List[FollowupResponse]:
        
        raw_prompt = load_prompt_template(PROMPT_PATH)
        prompt_template = PromptTemplate.from_template(raw_prompt)

        category_for_prompt = "tailored" if req.use_tailored_category else req.category
        vars = {
            "question_id": req.question_id,
            "category": category_for_prompt,
            "question_text": req.question_text,
            "criteria_csv": ", ".join(req.criteria) if req.criteria else "",
            "skills_csv": ", ".join(req.skills) if req.skills else "",
            "user_answer": req.user_answer,
            "evaluation_summary": req.evaluation_summary or "",
            "remaining_time_sec": req.remaining_time_sec if req.remaining_time_sec is not None else "null",
            "remaining_main_questions": req.remaining_main_questions if req.remaining_main_questions is not None else "null",
            "depth": req.depth,
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
            raise ValueError(f"LLM 꼬리질문 응답이 JSON 형식이 아닙니다. 오류: \n Raw JSON: {json_text}")

        responses: List[FollowupResponse] = []
        
        norm = self._normalize_items(parsed, req, memory) 
        followup = FollowupResponse.model_validate(norm)
        responses.append(followup)
        log_tail_question(memory, followup.model_dump())

        return responses
