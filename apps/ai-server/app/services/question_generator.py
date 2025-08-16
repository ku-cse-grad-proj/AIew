import json
import os
import re
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI

from app.models.question import InterviewQuestion, QuestionConstraints, UserInfo
from app.services.memory_logger import log_main_questions

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

PROMPT_PATH = (
    Path(__file__).resolve().parent.parent / "config/prompt/question_prompt.txt"
).resolve()


def load_prompt_template(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _strip_json(text: str) -> str:
    m = re.search(r"```json(.*?)```", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    text = text.strip()
    i, j = text.find("{"), text.rfind("}")
    return text[i : j + 1] if i != -1 and j != -1 and j > i else text


def _normalize_items(items: List[Dict]) -> List[Dict]:
    out: List[Dict] = []
    for i, q in enumerate(items[:5], start=1):
        out.append(
            {
                "main_question_id": f"q{i}",
                "category": q.get("category"),
                "criteria": q.get("criteria") or q.get("evaluation_criteria") or [],
                "skills": q.get("skills", []),
                "rationale": q.get("rationale"),
                "question_text": q.get("question_text") or q.get("question"),
                "estimated_answer_time_sec": q.get("estimated_answer_time_sec")
                or q.get("eta_sec")
                or 60,
            }
        )
    return out


def _dedupe_and_enforce(items: List[Dict], avoid_ids: List[str]) -> List[Dict]:
    # ID 중복 방지
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
    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY, temperature=0.3, model_name="gpt-4o"
    )

    chain: Runnable = prompt_template | llm

    vars = {
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

    res = chain.invoke(vars)
    content = res.content if hasattr(res, "content") else str(res)
    json_text = _strip_json(content)
    parsed = json.loads(json_text)

    items = parsed["main_questions"] if isinstance(parsed, dict) else parsed
    norm = _normalize_items(items)
    final = _dedupe_and_enforce(norm, constraints.avoid_question_ids)

    _ = [InterviewQuestion.model_validate(i) for i in final]
    log_main_questions(memory, final)

    return final
