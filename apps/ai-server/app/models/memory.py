from typing import (
    List, 
    Literal
)
from pydantic import (
    BaseModel,
    Field
)


# memory_debug.py 에서 사용되는 모델들
class Message(BaseModel):
    role: Literal["human", "ai", "system"] = "human"
    content: str = Field(..., description="메시지 내용")


class MemoryDump(BaseModel):
    session_id: str = Field(..., description="세션 ID")
    history_str: str = Field(..., description="ConversationBufferMemory가 합쳐서 내주는 문자열")
    messages: List[Message] = Field(..., description="원본 메시지 배열 (role, content)")


# session_log.py 에서 사용되는 모델들
class ShownQuestion(BaseModel):
    question: dict = Field(..., description="Question Details")


class UserAnswer(BaseModel):
    question_id: str = Field(..., pattern=r"^q\d+(-fu\d+)?$")
    answer: str = Field(..., description="User's Answer Text")
    answer_duration_sec: int = Field(..., description="Time taken to answer in seconds")