import json
import os
from typing import Any, Dict

from fastapi import Header, HTTPException
from langchain_core.chat_history import (
    BaseChatMessageHistory,
    InMemoryChatMessageHistory,
)
from langchain_redis import RedisChatMessageHistory

from app.models.event_types import EventType


class MemoryLogger:
    def __init__(
        self,
        memory: BaseChatMessageHistory,
        session_id: str = "",
    ):
        self.memory = memory
        self.session_id = session_id

    def _log(self, event_type: str, data: Dict[str, Any]) -> None:
        """단일 메시지로 이벤트 로깅 (JSON with type)"""
        message = {"type": event_type, "data": data}
        json_str = json.dumps(message, ensure_ascii=False)
        self.memory.add_ai_message(json_str[:8000])  # prevent exceeding memory limit

    # === 신규 메서드 (Phase 3에서 사용 예정) ===

    def log_question_asked(self, question_data: Dict[str, Any]) -> None:
        """질문이 물어짐 (메인/꼬리 통합)"""
        self._log(EventType.QUESTION_ASKED, question_data)

    def log_answer_received(self, answer_data: Dict[str, Any]) -> None:
        """답변이 수신됨"""
        self._log(EventType.ANSWER_RECEIVED, answer_data)

    def log_answer_evaluated(self, evaluation_data: Dict[str, Any]) -> None:
        """답변이 평가됨"""
        self._log(EventType.ANSWER_EVALUATED, evaluation_data)

    # === Deprecated (Phase 3에서 제거 예정) ===

    def log_shown_question(self, questions: Dict[str, Any] = {}) -> None:
        """Deprecated: log_question_asked() 사용 권장"""
        self._log(EventType.QUESTION_SHOWN, questions)

    def log_user_answer(
        self, question_id: str = "", answer: str = "", duration_sec: int = 0
    ) -> None:
        """Deprecated: log_answer_received() 사용 권장"""
        self._log(
            EventType.USER_ANSWER,
            {
                "question_id": question_id,
                "answer": answer,
                "answer_duration_sec": duration_sec,
            },
        )

    def log_evaluation(self, evaluation: Dict[str, Any] = {}) -> None:
        """Deprecated: log_answer_evaluated() 사용 권장"""
        self._log(EventType.ANSWER_EVALUATION, evaluation)

    def log_tail_question(self, followup: Dict[str, Any] = {}) -> None:
        """Deprecated: log_question_asked() 사용 권장 (parent_question_id 포함)"""
        self._log(EventType.TAIL_QUESTION, followup)

    def log_pdf_parsing(self, parsed_data: Dict[str, Any] = {}) -> None:
        """Deprecated: Phase 3에서 제거 예정 (메모리에 로깅하지 않음)"""
        self._log(EventType.PDF_PARSE, parsed_data)


class MemoryManager:
    _ttl: int = 14400  # 4시간
    _memory_store: Dict[str, InMemoryChatMessageHistory] = {}

    @classmethod
    def get_memory(cls, session_id: str = "") -> BaseChatMessageHistory:
        redis_url = os.getenv("REDIS_URL", "")
        if redis_url:
            return RedisChatMessageHistory(
                session_id=session_id,
                redis_url=redis_url,
                ttl=cls._ttl,
            )
        # Redis URL이 없으면 InMemory fallback
        if session_id not in cls._memory_store:
            cls._memory_store[session_id] = InMemoryChatMessageHistory()
        return cls._memory_store[session_id]

    @classmethod
    def MemoryDep(cls, x_session_id: str = Header(...)) -> BaseChatMessageHistory:
        if not x_session_id:
            raise HTTPException(status_code=400, detail="X-Session-Id header required")

        return cls.get_memory(x_session_id)
