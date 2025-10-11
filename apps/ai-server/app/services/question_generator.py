import json
from typing import Dict, List

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.question import InterviewQuestion, QuestionConstraints, UserInfo
from app.services.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)
from app.services.memory_logger import log_main_questions

PROMPT_PATH = (PROMPT_BASE_DIR / "question_prompt.txt").resolve()


def _normalize_items(items: List[Dict]) -> List[Dict]:
    out: List[Dict] = []
    for i, q in enumerate(items[:5], start=1):
        out.append(
            {
                "main_question_id": f"q{i}",
                "category": q.get("category"),
                "criteria": (q.get("criteria") or q.get("evaluation_criteria") or []),
                "skills": q.get("skills", []),
                "rationale": q.get("rationale"),
                "question_text": (q.get("question_text") or q.get("question")),
                "estimated_answer_time_sec": (
                    q.get("estimated_answer_time_sec") or q.get("eta_sec") or 60
                ),
            }
        )
    return out


def _dedupe_and_enforce(items: List[Dict], avoid_ids: List[str]) -> List[Dict]:
    out = []
    for q in items:
        if q["main_question_id"] in avoid_ids:
            continue
        out.append(q)
    return out[:5]


def generate_questions(
    user_info: UserInfo,
    constraints: QuestionConstraints,
    memory: ConversationBufferMemory,
) -> List[Dict]:
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
        "avoid_ids_csv": (
            ", ".join(constraints.avoid_question_ids)
            if constraints.avoid_question_ids
            else "none"
        ),
        "seed": (constraints.seed if constraints.seed is not None else "null"),
    }

    prompt_text = prompt_template.format(**vars)
    content = groq_chat(
        prompt_text, model="llama-3.1-8b-instant", max_tokens=2048, temperature=0.8
    )
    json_text = strip_json(content)

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        print(f"Raw JSON text: {json_text}")
        raise

    items = (
        parsed["main_questions"]
        if isinstance(parsed, dict) and "main_questions" in parsed
        else parsed
    )
    if not isinstance(items, list):
        raise ValueError("Parsed content is not a list of questions.")

    norm = _normalize_items(items)
    final = _dedupe_and_enforce(norm, constraints.avoid_question_ids)

    _ = [InterviewQuestion.model_validate(i) for i in final]
    log_main_questions(memory, final)

    return final
