import json
import os
import re
from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI

from app.models.followup import Followup, FollowupRequest
from app.services.memory_logger import log_tail_question

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

PROMPT_PATH = (
    Path(__file__).resolve().parent.parent / "config/prompt" / "followup_prompt.txt"
).resolve()


def _load_prompt_template(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _strip_json(text: str) -> str:
    m = re.search(r"```json(.*?)```", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    text = text.strip()
    i, j = text.find("{"), text.rfind("}")
    return text[i : j + 1] if i != -1 and j != -1 and j > i else text


def _count_existing_followups(
    memory: Optional[ConversationBufferMemory], parent_qid: str
) -> int:
    if memory is None:  # 메모리 미사용이면 0으로 간주
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
    raw_prompt = _load_prompt_template(PROMPT_PATH)
    prompt_template = PromptTemplate.from_template(raw_prompt)

    llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, temperature=0.2, model="gpt-4o")
    chain: Runnable = prompt_template | llm

    category_for_prompt = "tailored" if req.use_tailored_category else req.category
    vars: Dict[str, str | int | None] = {
        "question_id": req.question_id,
        "category": category_for_prompt,
        "question_text": req.question_text,
        "criteria_csv": ", ".join(req.criteria) if req.criteria else "",
        "skills_csv": ", ".join(req.skills) if req.skills else "",
        "user_answer": req.user_answer,
        "evaluation_summary": req.evaluation_summary or "",
        "remaining_time_sec": req.remaining_time_sec
        if req.remaining_time_sec is not None
        else "null",
        "remaining_main_questions": req.remaining_main_questions
        if req.remaining_main_questions is not None
        else "null",
        "depth": req.depth,
    }

    result = chain.invoke(vars)
    content = result.content if hasattr(result, "content") else str(result)
    json_text = _strip_json(content)

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM 꼬리질문 응답이 JSON 형식이 아닙니다: {e}")

    if "question" not in parsed and "question_text" in parsed:
        parsed["question"] = parsed["question_text"]

    if req.auto_sequence:
        existing = _count_existing_followups(memory, req.question_id)
        idx = existing + 1
    else:
        idx = req.next_followup_index or 1

    # 필수/기본값 보정
    parsed.setdefault("parent_question_id", req.question_id)
    parsed["followup_id"] = f"{req.question_id}-fu{idx}"
    parsed.setdefault("focus_criteria", req.criteria or [])
    parsed.setdefault("expected_answer_time_sec", 45)

    # alias(question_text <-> question) 양쪽 허용
    if "question_text" not in parsed and "question" in parsed:
        parsed["question_text"] = parsed["question"]

    followup = Followup.model_validate(parsed)
    if memory is not None:
        log_tail_question(memory, followup.model_dump())

    return followup
