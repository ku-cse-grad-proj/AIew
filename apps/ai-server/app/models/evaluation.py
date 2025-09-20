from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class TailDecision(str, Enum):
    create = "create"
    skip = "skip"


class CriterionScore(BaseModel):
    name: str = Field(..., description="평가 기준명(예: 명확성, 깊이)")
    score: int = Field(..., ge=1, le=5, description="1~5 정수 점수")
    reason: str = Field(..., description="해당 기준 점수 부여 이유")


class AnswerEvaluationResult(BaseModel):
    question_id: str = Field(..., description="평가 대상 질문 ID (q1~q5)")
    category: str = Field(..., description="behavioral|technical|tailored")
    answer_duration_sec: int = Field(..., ge=0, description="사용자 답변 소요 시간(초)")
    overall_score: int = Field(..., ge=1, le=5, description="총평 1~5")
    strengths: List[str] = Field(default_factory=list, max_items=5)
    improvements: List[str] = Field(default_factory=list, max_items=5)  # 개선점 목록
    red_flags: List[str] = Field(default_factory=list, max_items=5)  #  지원자를 더 주의깊게 살펴야한다는 신호
    criterion_scores: List[CriterionScore] = Field(default_factory=list, description="각 기준별 점수")
    feedback: str = Field(..., description="300±50자 내외의 답변별 피드백")
    tail_rationale: Optional[str] = Field(None, description="꼬리질문 생성 여부 판단 근거")
    tail_decision: TailDecision = Field(..., description="create|skip")


class AnswerEvaluationRequest(BaseModel):
    question_id: str
    category: str
    criteria: List[str]
    skills: List[str] = []
    question_text: str
    user_answer: str
    answer_duration_sec: int
    remaining_time_sec: Optional[int] = None
    remaining_main_questions: Optional[int] = None
    use_tailored_category: bool = Field(False, description="True면 평가 프롬프트에 전달되는 category를 'tailored'로 강제")

    model_config = {
        "json_schema_extra": {
            "example": {
                "question_id": "q2",
                "category": "technical",
                "criteria": ["명확성", "깊이", "근거"],
                "skills": ["React", "TypeScript"],
                "question_text": "React와 TypeScript를 사용하여 UI 컴포넌트 설계 시 고려 사항은 무엇일까요?",
                "user_answer": "재사용성, 타입 안전성, 접근성, 성능을 우선합니다.",
                "answer_duration_sec": 70,
                "remaining_time_sec": 480,
                "remaining_main_questions": 3,
                "use_tailored_category": False,
            }
        }
    }


class SessionEvaluationResult(BaseModel):
    average_score: float = Field(..., ge=1.0, le=5.0, description="세션 전체 평균 점수")
    session_feedback: str = Field(..., description="1000±50자 내외의 세션 종합 피드백")
    