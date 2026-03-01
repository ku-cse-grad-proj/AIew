from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class FollowupRequest(BaseModel):
    aiQuestionId: str = Field(..., description="부모 메인 질문 ID (예: q1)")
    type: str = Field(..., description="behavioral|technical|tailored")
    question: str = Field(..., description="부모 질문 본문")
    criteria: List[str] = Field(
        default_factory=list, description="평가 기준(부족한 부분을 파고듦)"
    )
    skills: List[str] = Field(default_factory=list, description="측정 역량 태그")
    answer: str = Field(..., description="사용자 답변 전문")
    evaluationSummary: Optional[str] = Field(
        None, description="이전 평가 요약(강점/개선점/레드플래그 요약 텍스트)"
    )
    autoSequence: bool = Field(
        True, description="True면 기존 꼬리질문 수를 기준으로 fu 번호 자동 증가"
    )
    nextFollowupIndex: Optional[int] = Field(
        None,
        ge=1,
        description="수동으로 fu 인덱스 지정(q3-fu{index}). autoSequence=True면 무시",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "aiQuestionId": "q3",
                "type": "technical",
                "question": "Node.js와 Express로 API 성능을 어떻게 최적화했나요?",
                "criteria": ["문제 해결", "성능 이해도", "재현 가능성"],
                "skills": ["Node.js", "Express", "Redis"],
                "answer": "API 성능 최적화를 위해 여러 가지 접근을 시도했습니다. 먼저 데이터베이스 쿼리를 분석해 불필요한 풀스캔을 없애고, 필요한 곳에 인덱스를 추가했습니다. 또한 Redis를 활용해 자주 조회되는 데이터를 캐싱하여 응답 속도를 크게 줄였습니다. 네트워크 측면에서는 gzip 압축과 HTTP/2를 적용해 전송 효율을 높였고, 서버 운영 환경에서는 PM2 클러스터 모드로 멀티코어를 활용하며 무중단 배포를 구현했습니다. 마지막으로 New Relic을 이용해 성능 지표를 실시간 모니터링하며, 병목 구간이 발견되면 즉시 개선 작업을 진행했습니다.",
                "evaluationSummary": "강점: 방법 다양. 개선: 수치/검증 근거 부족.",
            }
        }
    }


class FollowupResponse(BaseModel):
    followupId: Optional[str] = Field(
        None, description="꼬리질문 ID (서비스 레벨에서 채번)"
    )
    parentQuestionId: str = Field(..., description="부모 메인 질문 ID")
    focusCriteria: List[str] = Field(
        default_factory=list, description="파고들 포커스 기준"
    )
    rationale: str = Field(..., description="꼬리질문 생성 근거")
    question: str = Field(..., description="꼬리질문 본문")
    expectedAnswerTimeSec: int = Field(
        180, ge=15, le=180, description="예상 답변 시간(초)"
    )

    @field_validator("expectedAnswerTimeSec", mode="before")
    @classmethod
    def clamp_time(cls, v: Any) -> Any:
        if v is None or (isinstance(v, str) and v.lower() in ("", "none", "null")):
            return 180
        try:
            return max(15, min(180, int(round(float(v)))))
        except (TypeError, ValueError):
            return 180

    @field_validator("focusCriteria", mode="before")
    @classmethod
    def clean_criteria_list(cls, v: Any) -> Any:
        if not isinstance(v, list):
            return ["N/A"]
        cleaned = [
            str(item).strip() for item in v if item is not None and str(item).strip()
        ]
        return cleaned if cleaned else ["N/A"]

    @field_validator("parentQuestionId", "rationale", mode="before")
    @classmethod
    def clean_string(cls, v: Any) -> Any:
        if not isinstance(v, str) or v.lower() in ("", "none", "null"):
            return ""
        return v

    @field_validator("question", mode="before")
    @classmethod
    def clean_question(cls, v: Any) -> Any:
        if (
            v is None
            or not isinstance(v, str)
            or v.strip() == ""
            or v.lower() in ("none", "null")
        ):
            return ""
        return v.strip()

    model_config = {
        "json_schema_extra": {
            "example": {
                "parentQuestionId": "q3",
                "focusCriteria": ["성능 개선", "캐싱 전략"],
                "rationale": "사용자가 API 성능 최적화에 대해 구체적인 기술과 방법론을 언급했으나, 캐싱 전략과 네트워크 최적화에 대한 상세한 설명이 부족했습니다. 따라서 이 꼬리질문을 통해 해당 부분을 집중적으로 파고들어 사용자의 깊은 이해도를 평가하고자 합니다.",
                "question": "캐싱 전략을 구체적으로 설명해주시겠어요? 어떤 데이터를 캐싱했고, 캐싱 정책은 어떻게 설정했나요?",
                "expectedAnswerTimeSec": 60,
            }
        }
    }
