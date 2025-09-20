from typing import List, Optional

from pydantic import BaseModel, Field


class FollowupRequest(BaseModel):
    question_id: str = Field(..., description="부모 메인 질문 ID (예: q1)")
    category: str = Field(..., description="behavioral|technical|tailored")
    question_text: str = Field(..., description="부모 질문 본문")
    criteria: List[str] = Field(
        default_factory=list, description="평가 기준(부족한 부분을 파고듦)"
    )
    skills: List[str] = Field(default_factory=list, description="측정 역량 태그")
    user_answer: str = Field(..., description="사용자 답변 전문")
    evaluation_summary: Optional[str] = Field(
        None, description="이전 평가 요약(강점/개선점/레드플래그 요약 텍스트)"
    )
    remaining_time_sec: Optional[int] = Field(None, description="남은 면접 시간(초)")
    remaining_main_questions: Optional[int] = Field(
        None, description="남은 메인 질문 수"
    )
    depth: int = Field(
        1, ge=1, le=3, description="꼬리질문 추궁 강도(1=가벼움, 3=깊게)"
    )
    use_tailored_category: bool = Field(
        False,
        description="True면 꼬리질문 category를 항상 'tailored'로 간주하여 프롬프트에 전달",
    )
    auto_sequence: bool = Field(
        True, description="True면 기존 꼬리질문 수를 기준으로 fu 번호 자동 증가"
    )
    next_followup_index: Optional[int] = Field(
        None,
        ge=1,
        description="수동으로 fu 인덱스 지정(q3-fu{index}). auto_sequence=True면 무시",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "question_id": "q3",
                "category": "technical",
                "question_text": "Node.js와 Express로 API 성능을 어떻게 최적화했나요?",
                "criteria": ["문제 해결", "성능 이해도", "재현 가능성"],
                "skills": ["Node.js", "Express", "Redis"],
                "user_answer": "API 성능 최적화를 위해 여러 가지 접근을 시도했습니다. 먼저 데이터베이스 쿼리를 분석해 불필요한 풀스캔을 없애고, 필요한 곳에 인덱스를 추가했습니다. 또한 Redis를 활용해 자주 조회되는 데이터를 캐싱하여 응답 속도를 크게 줄였습니다. 네트워크 측면에서는 gzip 압축과 HTTP/2를 적용해 전송 효율을 높였고, 서버 운영 환경에서는 PM2 클러스터 모드로 멀티코어를 활용하며 무중단 배포를 구현했습니다. 마지막으로 New Relic을 이용해 성능 지표를 실시간 모니터링하며, 병목 구간이 발견되면 즉시 개선 작업을 진행했습니다.",
                "evaluation_summary": "강점: 방법 다양. 개선: 수치/검증 근거 부족.",
                "remaining_time_sec": 820,
                "remaining_main_questions": 4,
                "depth": 2,
                "use_tailored_category": True,
            }
        }
    }


class Followup(BaseModel):
    followup_id: str = Field(..., description="꼬리질문 ID (예: q1-fu1)")
    parent_question_id: str = Field(..., description="부모 메인 질문 ID")
    focus_criteria: List[str] = Field(
        default_factory=list, description="파고들 포커스 기준"
    )
    rationale: str = Field(..., description="꼬리질문 생성 근거")
    question_text: str = Field(..., alias="question", description="꼬리질문 본문")
    expected_answer_time_sec: int = Field(
        45, ge=15, le=180, description="예상 답변 시간(초)"
    )

    model_config = {"populate_by_name": True}
