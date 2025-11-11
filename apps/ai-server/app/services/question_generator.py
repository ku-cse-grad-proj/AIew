import json
from typing import Any, Dict, List

from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from app.models.question import QuestionConstraints, QuestionResponse, UserInfo
from app.services.memory_logger import MemoryLogger
from app.utils.llm_utils import (
    PROMPT_BASE_DIR,
    groq_chat,
    load_prompt_template,
    strip_json,
)

PROMPT_PATH = (PROMPT_BASE_DIR / "question_prompt.txt").resolve()


class QuestionGeneratorService:
    def __init__(
        self,
        memory: ConversationBufferMemory = None,
        session_id: str = "",
    ):
        self.memory = memory
        self.session_id = session_id
        self.logger = MemoryLogger(memory=memory, session_id=session_id)

    def _preprocess_parsed(self, item: Dict[str, Any]) -> Dict[str, Any]:
        key_time = "estimated_answer_time_sec"
        time_sec = item.get(key_time)
        if time_sec is None or (
            isinstance(time_sec, str) and time_sec.lower() in ("none", "null")
        ):
            item[key_time] = 180
        elif isinstance(time_sec, (int, float)):
            time = int(round(time_sec))
            item[key_time] = max(10, min(600, time))
        else:
            item[key_time] = 180

        for key in ["main_question_id", "category", "rationale"]:
            value = item.get(key)
            if (
                value is None
                or not isinstance(value, str)
                or value.lower() in ("none", "null")
            ):
                item[key] = ""

        question_keys = ["question_text", "question"]
        found_question = False

        for q_key in question_keys:
            value = item.get(q_key)
            if (
                isinstance(value, str)
                and value.strip()
                and value.lower() not in ("null", "none")
            ):
                item["question_text"] = value.strip()
                item["question"] = value.strip()
                found_question = True
                break
        if not found_question:
            item["question_text"] = ""
            item["question"] = ""

        for key in ["criteria", "skills"]:
            value = item.get(key)
            if value is None or not isinstance(value, List):
                item[key] = ["N/A"]  # default value
            elif not all(isinstance(v, str) for v in value):
                cleaned_list = [str(v) for v in value if v is not None]
                item[key] = cleaned_list
                if not cleaned_list:
                    item[key] = ["N/A"]
            elif not value:
                item[key] = ["N/A"]

        return item

    def _normalize_items(
        self, items: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for i, q in enumerate(items[:5], start=1):
            q = self._preprocess_parsed(q)
            out.append(
                {
                    "main_question_id": f"q{i}",
                    "category": q.get("category", ""),
                    "criteria": q.get("criteria", []),
                    "skills": q.get("skills", []),
                    "rationale": q.get("rationale", ""),
                    "question": q.get("question_text", "") or q.get("question", ""),
                    "estimated_answer_time_sec": q.get(
                        "estimated_answer_time_sec", 180
                    ),
                }
            )
        return out

    def _dedupe_and_enforce(
        self, items: List[Dict[str, Any]] = [], avoid_ids: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        out = []
        for q in items:
            if q["main_question_id"] in avoid_ids:
                continue
            out.append(q)
        return out[:5]

    def generate_questions(
        self,
        user_info: UserInfo = ...,
        constraints: QuestionConstraints = ...,
        memory: ConversationBufferMemory = ...,
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
            "avoid_ids_csv": ", ".join(constraints.avoid_question_ids)
            if constraints.avoid_question_ids
            else "none",
            "seed": constraints.seed if constraints.seed is not None else "null",
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
                f"LLM 질문 생성 응답이 JSON 형식이 아닙니다.\n Raw JSON: {json_text}"
            )

        items = (
            parsed["main_questions"]
            if isinstance(parsed, dict) and "main_questions" in parsed
            else parsed
        )
        if not isinstance(items, list):
            raise ValueError("Parsed content is not a list of questions.")

        norm = self._normalize_items(items)
        final = self._dedupe_and_enforce(norm, constraints.avoid_question_ids)

        _ = [QuestionResponse.model_validate(i) for i in final]
        self.logger.log_main_questions(final)

        return final
