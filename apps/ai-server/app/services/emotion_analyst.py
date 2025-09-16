from app.models.emotion_analysis import EmotionGroupScore, EmotionGroupResult
from langchain.memory import ConversationBufferMemory
from typing import List, Dict
import ast

class EmotionAnalysisService:
    def __init__(self, memory: ConversationBufferMemory, session_id: str):
        self.memory = memory
        self.session_id = session_id
        self.raw = self._extract_raw()

    def _extract_raw(self) -> List[Dict]:
        msgs = getattr(self.memory.chat_memory, "messages", [])
        frames = []
        for m in msgs:
            if "[FACE_ANALYSIS]" in m.content:
                try:
                    payload = m.content.split("[FACE_ANALYSIS]", 1)[-1].strip()
                    parsed = ast.literal_eval(payload)
                    for item in parsed.get("results", []):
                        # 필수 키가 모두 있는지 확인
                        required_keys = [
                            "frame", "time", "happy", "sad",
                            "neutral", "angry", "fear", "surprise"
                        ]
                        if all(k in item for k in required_keys):
                            frames.append(item)
                except Exception as e:
                    # 에러 로그 출력해도 좋음
                    print(f"Error parsing message: {e}")
                    continue
        return frames

    def _score_group(self) -> List[EmotionGroupScore]:
        # 프레임별 감정 확률을 EmotionGroupScore 인스턴스로 변환
        return [EmotionGroupScore(**item) for item in self.raw]

    def run(self, file_name: str = "") -> EmotionGroupResult:
        return EmotionGroupResult(file_name=file_name, results=self._score_group())
