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
    aiQuestionId: str = Field(..., description="평가 대상 질문 ID (q1~q5)")
    type: str = Field(..., description="behavioral|technical|tailored")
    answerDurationSec: int = Field(..., ge=0, description="사용자 답변 소요 시간(초)")
    overallScore: int = Field(..., ge=1, le=5, description="총평 1~5")
    strengths: List[str] = Field(default_factory=list, max_items=5)
    improvements: List[str] = Field(default_factory=list, max_items=5)
    redFlags: List[str] = Field(default_factory=list, max_items=5)
    criterionScores: List[CriterionScore] = Field(
        default_factory=list, description="각 기준별 점수"
    )
    feedback: str = Field(..., description="300±50자 내외의 답변별 피드백")
    tailRationale: Optional[str] = Field(
        None, description="꼬리질문 생성 여부 판단 근거"
    )
    tailDecision: TailDecision = Field(..., description="create|skip")

    model_config = {
        "json_schema_extra": {
            "example": {
                "aiQuestionId": "q2",
                "type": "technical",
                "answerDurationSec": 70,
                "overallScore": 4,
                "strengths": ["명확한 설명", "구체적인 예시 제공"],
                "improvements": ["더 많은 근거 제시", "답변의 깊이 향상"],
                "redFlags": ["긴 답변 시간"],
                "criterionScores": [
                    {
                        "name": "명확성",
                        "score": 5,
                        "reason": "답변이 매우 명확했습니다.",
                    },
                    {"name": "깊이", "score": 4, "reason": "일부 깊이가 부족했습니다."},
                    {"name": "근거", "score": 3, "reason": "근거가 다소 부족했습니다."},
                ],
                "feedback": "전반적으로 좋은 답변이었으나, 더 많은 근거와 깊이를 추가하면 더욱 향상될 것입니다.",
                "tailRationale": "답변에서 특정 기술에 대한 깊은 이해가 부족하여 꼬리질문이 필요합니다.",
                "tailDecision": "create",
            }
        }
    }


class AnswerEvaluationRequest(BaseModel):
    aiQuestionId: str = Field(..., description="평가 대상 질문 ID (q1~q5)")
    type: str = Field(..., description="behavioral|technical")
    criteria: List[str] = Field(default_factory=list, description="평가 기준 목록")
    skills: List[str] = Field(default_factory=list, description="관련 기술 스택 목록")
    questionText: str = Field(..., description="질문 텍스트")
    userAnswer: str = Field(..., description="사용자 답변 텍스트")
    answerDurationSec: int = Field(..., ge=0, description="사용자 답변 소요 시간(초)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "aiQuestionId": "q2",
                "type": "technical",
                "criteria": ["명확성", "깊이", "근거"],
                "skills": ["React", "TypeScript"],
                "questionText": "React와 TypeScript를 사용하여 UI 컴포넌트 설계 시 고려 사항은 무엇일까요?",
                "userAnswer": "재사용성, 타입 안전성, 접근성, 성능을 우선합니다.",
                "answerDurationSec": 70,
            }
        }
    }


class SessionEvaluationResult(BaseModel):
    averageScore: float = Field(..., ge=1.0, le=5.0, description="세션 전체 평균 점수")
    sessionFeedback: str = Field(..., description="1000±50자 내외의 세션 종합 피드백")

    model_config = {
        "json_schema_extra": {
            "example": {
                "averageScore": 4.2,
                "sessionFeedback": "이번 세션에서 전반적으로 우수한 답변을 제공하셨습니다. 특히 기술적 질문에 대한 깊이 있는 이해와 명확한 설명이 돋보였습니다. 다만, 일부 질문에서는 더 구체적인 근거와 예시를 제시하면 더욱 향상될 수 있습니다. 앞으로도 이러한 강점을 유지하면서 개선할 부분에 집중하시면 좋겠습니다. 전체적으로 매우 긍정적인 평가를 드립니다.",
            }
        }
    }
