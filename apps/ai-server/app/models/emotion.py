from typing import Dict, List, Union
from pydantic import BaseModel, Field


class EmotionGroupScore(BaseModel):
    frame: int = Field(..., description="프레임 번호. 영상에서 몇번째 프레임인지")
    time: float = Field(..., description="해당 프레임의 시간(초)")
    happy: float = Field(..., description="happy 감정 확률(0.0~1.0)")
    sad: float = Field(..., description="sad 감정 확률(0.0~1.0)")
    neutral: float = Field(..., description="neutral 감정 확률(0.0~1.0)")
    angry: float = Field(..., description="angry 감정 확률(0.0~1.0)")
    fear: float = Field(..., description="fear 감정 확률(0.0~1.0)")
    surprise: float = Field(..., description="surprise 감정 확률(0.0~1.0)")

class EmotionGroupResult(BaseModel):
    file_name: str = Field(..., description="분석에 사용된 영상 파일명")
    results: List[EmotionGroupScore] = Field(..., description="프레임별 감정 확률 리스트")
