import json
from typing import Dict, Optional

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.followup import Followup, FollowupRequest
from app.services.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)
from app.services.memory_logger import log_tail_question

PROMPT_PATH = (PROMPT_BASE_DIR / "followup_prompt.txt").resolve()


def _count_existing_followups(
    memory: Optional[ConversationBufferMemory], parent_qid: str
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


def generate_followups(
    req: FollowupRequest, memory: Optional[ConversationBufferMemory] = None
) -> Followup:
    raw_prompt = load_prompt_template(PROMPT_PATH)
    prompt_template = PromptTemplate.from_template(raw_prompt)

    category_for_prompt = "tailored" if req.use_tailored_category else req.category
    vars: Dict[str, str | int | None] = {
        "question_id": req.question_id,
        "category": category_for_prompt,
        "question_text": req.question_text,
        "criteria_csv": (", ".join(req.criteria) if req.criteria else ""),
        "skills_csv": (", ".join(req.skills) if req.skills else ""),
        "user_answer": req.user_answer,
        "evaluation_summary": req.evaluation_summary or "",
        "remaining_time_sec": (
            req.remaining_time_sec if req.remaining_time_sec is not None else "null"
        ),
        "remaining_main_questions": (
            req.remaining_main_questions
            if req.remaining_main_questions is not None
            else "null"
        ),
        "depth": req.depth,
    }

    prompt_text = prompt_template.format(**vars)
    content = groq_chat(
        prompt_text, model="llama-3.1-8b-instant", max_tokens=1024, temperature=0.8
    )
    json_text = strip_json(content)

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"LLM 꼬리질문 응답이 JSON 형식이 아닙니다. 오류: {e}\n Raw JSON: {json_text}"
        )

    if "question" not in parsed and "question_text" in parsed:
        parsed["question"] = parsed["question_text"]

    if req.auto_sequence:
        existing = _count_existing_followups(memory, req.question_id)
        idx = existing + 1
    else:
        idx = req.next_followup_index or 1

    parsed.setdefault("parent_question_id", req.question_id)
    parsed["followup_id"] = f"{req.question_id}-fu{idx}"
    parsed.setdefault("focus_criteria", req.criteria or [])
    parsed.setdefault("expected_answer_time_sec", 45)

    if "question_text" not in parsed and "question" in parsed:
        parsed["question_text"] = parsed["question"]

    followup = Followup.model_validate(parsed)
    if memory is not None:
        log_tail_question(memory, followup.model_dump())

    return followup
