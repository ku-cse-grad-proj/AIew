import json
from typing import (
    Any, 
    Dict, 
    List
)

from langchain.memory import ConversationBufferMemory

from app.utils.pdf_utils import (
    is_digital_pdf,
    extract_text_from_digital_pdf,
    extract_text_from_image_pdf,
    preprocess_text
)


class PDFAnalysisService:
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
        preprocessed_text: str = "", 
        is_digital: bool = True
    ):
        
        payload: Dict[str, Any] = {
            "filename": file_name,
            "digital": is_digital,
            "preprocessed_text": preprocessed_text
        }

        self.memory.chat_memory.add_user_message(
            "[PDF_PARSE]" + json.dumps(payload, ensure_ascii=False)
        )

    def process_and_persist(
        self, 
        file_bytes: bytes = b"", 
        file_name: str = ""
    ) -> str:
        
        is_digital = is_digital_pdf(file_bytes)
        extracted_text = (
            extract_text_from_digital_pdf(file_bytes)
            if is_digital else
            extract_text_from_image_pdf(file_bytes)
        )
        
        preprocessed_sentences = preprocess_text(extracted_text)
        
        self._save_results_to_memory(
            file_name, 
            is_digital,
            preprocessed_sentences
        )
            
        return preprocessed_sentences
