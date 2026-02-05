from typing import List, Literal

from pydantic import BaseModel, Field


# memory_debug.py 에서 사용되는 모델들
class Message(BaseModel):
    role: Literal["human", "ai", "system"] = "human"
    content: str = Field(..., description="메시지 내용")


class MemoryDump(BaseModel):
    session_id: str = Field(..., description="세션 ID")
    history_str: str = Field(..., description="Memory가 합쳐서 내주는 문자열")
    messages: List[Message] = Field(..., description="원본 메시지 배열 (role, content)")


""" session_log.py 에서 사용되는 모델들 """


class QuestionAskedRequest(BaseModel):
    """QUESTION_ASKED 로깅 요청 (메인/꼬리 통합)"""

    aiQuestionId: str = Field(..., pattern=r"^q\d+(-fu\d+)?$")
    question: str
    type: str
    criteria: List[str]
    skills: List[str]
    rationale: str | None = None
    estimatedAnswerTimeSec: int | None = None
    parentQuestionId: str | None = None


class AnswerReceivedRequest(BaseModel):
    """ANSWER_RECEIVED 로깅 요청"""

    aiQuestionId: str = Field(..., pattern=r"^q\d+(-fu\d+)?$")
    answer: str = Field(..., description="User's answer text")
    answerDurationSec: int = Field(..., description="Time taken to answer in seconds")


""" restore 엔드포인트에서 사용되는 모델들 """


class CriterionScoreData(BaseModel):
    name: str
    score: int
    reason: str


class EvaluationData(BaseModel):
    aiQuestionId: str
    type: str
    answerDurationSec: int
    overallScore: int
    strengths: List[str]
    improvements: List[str]
    redFlags: List[str]
    criterionScores: List[CriterionScoreData]
    feedback: str
    tailRationale: str | None = None
    tailDecision: str


class StepRestoreData(BaseModel):
    # 질문 정보 (QUESTION_ASKED용)
    aiQuestionId: str = Field(..., description="질문 ID (q1 or q1-fu1)")
    type: str
    question: str
    criteria: List[str]
    skills: List[str]
    rationale: str | None = None
    estimatedAnswerTimeSec: int | None = None

    # 꼬리질문인 경우 (parentQuestionId 필드로 구분)
    parentQuestionId: str | None = None

    # 답변 (ANSWER_RECEIVED용)
    answer: str | None = None
    answerDurationSec: int | None = None

    # 평가 (ANSWER_EVALUATED용)
    evaluation: EvaluationData | None = None


class RestoreRequest(BaseModel):
    steps: List[StepRestoreData]
