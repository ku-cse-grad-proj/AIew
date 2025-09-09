from typing import List
from pydantic import BaseModel, Field

class FaceExpressionResult(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0, description="인식 신뢰도 (0~1)")
    emotion: str = Field(..., description="추론된 감정 또는 상태 (예: confident, natural, focused)")
    metric: str = Field(..., description="평가 항목 (예: tension, naturalness, concentration)")

class FaceExpressionsResponse(BaseModel):
    results: List[FaceExpressionResult] = Field(default_factory=list, description="얼굴 분석 결과 리스트")
    image_id: str = Field(..., description="이미지 또는 프레임 식별자")