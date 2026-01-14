from typing import List, Literal

from pydantic import BaseModel, Field


# memory_debug.py 에서 사용되는 모델들
class Message(BaseModel):
    role: Literal["human", "ai", "system"] = "human"
    content: str = Field(..., description="메시지 내용")


class MemoryDump(BaseModel):
    session_id: str = Field(..., description="세션 ID")
    history_str: str = Field(
        ..., description="ConversationBufferMemory가 합쳐서 내주는 문자열"
    )
    messages: List[Message] = Field(..., description="원본 메시지 배열 (role, content)")


# session_log.py 에서 사용되는 모델들
class ShownQuestion(BaseModel):
    question: dict = Field(..., description="Question Details")


class UserAnswer(BaseModel):
    question_id: str = Field(..., pattern=r"^q\d+(-fu\d+)?$")
    answer: str = Field(..., description="User's Answer Text")
    answer_duration_sec: int = Field(..., description="Time taken to answer in seconds")


# restore 엔드포인트에서 사용되는 모델들
class CriterionScoreData(BaseModel):
    name: str
    score: int
    reason: str


class EvaluationData(BaseModel):
    question_id: str
    category: str
    answer_duration_sec: int
    overall_score: int
    strengths: List[str]
    improvements: List[str]
    red_flags: List[str]
    criterion_scores: List[CriterionScoreData]
    feedback: str
    tail_rationale: str | None = None
    tail_decision: str


class StepRestoreData(BaseModel):
    # 질문 정보 (QUESTION_SHOWN용)
    question_id: str = Field(..., description="질문 ID (q1 or q1-fu1)")
    category: str
    question_text: str
    criteria: List[str]
    skills: List[str]
    rationale: str | None = None
    estimated_answer_time_sec: int | None = None

    # 꼬리질문인 경우 (TAIL_QUESTION용)
    is_followup: bool = False
    parent_question_id: str | None = None
    focus_criteria: List[str] | None = None

    # 답변 (USER_ANSWER용)
    answer: str | None = None
    answer_duration_sec: int | None = None

    # 평가 (ANSWER_EVALUATION용)
    evaluation: EvaluationData | None = None


class RestoreRequest(BaseModel):
    resume_text: str
    portfolio_text: str
    steps: List[StepRestoreData]
