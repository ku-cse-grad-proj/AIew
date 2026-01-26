import json
from typing import Any, Dict

from fastapi import Header, HTTPException
from langchain_core.chat_history import (
    BaseChatMessageHistory,
    InMemoryChatMessageHistory,
)


class MemoryLogger:
    def __init__(
        self,
        memory: BaseChatMessageHistory,
        session_id: str = "",
    ):
        self.memory = memory
        self.session_id = session_id

    def _log(self, title: str = "", payload: Dict[str, Any] = {}) -> None:
        pretty = json.dumps(payload, ensure_ascii=False, indent=4)
        # HumanMessage로 입력, AIMessage로 출력 로깅
        self.memory.add_user_message(f"[{title}]")
        self.memory.add_ai_message(pretty[:4000])  # prevent exceeding memory limit

    def log_shown_question(self, questions: Dict[str, Any] = {}) -> None:
        self._log("QUESTION_SHOWN", questions)

    def log_user_answer(
        self, question_id: str = "", answer: str = "", duration_sec: int = 0
    ) -> None:
        self._log(
            "USER_ANSWER",
            {
                "question_id": question_id,
                "answer": answer,
                "answer_duration_sec": duration_sec,
            },
        )

    def log_evaluation(self, evaluation: Dict[str, Any] = {}) -> None:
        self._log("ANSWER_EVALUATION", evaluation)

    def log_tail_question(self, followup: Dict[str, Any] = {}) -> None:
        self._log("TAIL_QUESTION", followup)

    def log_pdf_parsing(self, parsed_data: Dict[str, Any] = {}) -> None:
        self._log("PDF_PARSE", parsed_data)


class MemoryManager:
    _memory_store: Dict[str, InMemoryChatMessageHistory] = {}

    @classmethod
    def get_memory(cls, session_id: str = "") -> BaseChatMessageHistory:
        if session_id not in cls._memory_store:
            cls._memory_store[session_id] = InMemoryChatMessageHistory()
        return cls._memory_store[session_id]

    @classmethod
    def MemoryDep(cls, x_session_id: str = Header(...)) -> BaseChatMessageHistory:
        if not x_session_id:
            raise HTTPException(status_code=400, detail="X-Session-Id header required")

        return cls.get_memory(x_session_id)
