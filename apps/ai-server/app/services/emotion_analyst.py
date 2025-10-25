import json
from typing import (
    Any,
    Dict, 
    List
)

from langchain.memory import ConversationBufferMemory

from app.utils.video_analysis import video_analysis


class EmotionAnalysisService:
    def __init__(
        self, 
        memory: ConversationBufferMemory = None, 
        session_id: str = ""
    ):
        
        self.memory = memory
        self.session_id = session_id

    def _save_results_to_memory(
        self, 
        file_name: str = "", 
        results: List[Dict] = []
    ):
        
        payload: Dict[str, Any] = {
            "filename": file_name, 
            "results": results
        }

        self.memory.chat_memory.add_user_message(
            "[FACE_ANALYSIS]" + json.dumps(payload, ensure_ascii=False)
        )
        
    def process_and_persist(
        self, 
        file_path: str = "", 
        file_name: str = ""
    ) -> List[Dict]:
        
        results = video_analysis(file_path)
        if results:
            self._save_results_to_memory(
                file_name, 
                results
            )
        
        return results