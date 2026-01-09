from typing import (
    Any,
    Dict,
)

from langchain.memory import ConversationBufferMemory

from app.services.memory_logger import MemoryLogger
from app.utils.pdf_utils import (
    extract_text_from_digital_pdf,
    extract_text_from_image_pdf,
    is_digital_pdf,
    preprocess_text,
)


class PDFAnalysisService:
    def __init__(self, memory: ConversationBufferMemory = None, session_id: str = ""):
        self.memory = memory
        self.session_id = session_id
        self.logger = MemoryLogger(memory=memory, session_id=session_id)

    def process_and_persist(self, file_bytes: bytes = b"", file_name: str = "") -> str:
        is_digital = is_digital_pdf(file_bytes)
        extracted_text = (
            extract_text_from_digital_pdf(file_bytes)
            if is_digital
            else extract_text_from_image_pdf(file_bytes)
        )

        preprocessed_text = preprocess_text(extracted_text)

        parsed_data: Dict[str, Any] = {
            "filename": file_name,
            "digital": is_digital,
            "preprocessed_text": preprocessed_text,
        }

        self.logger.log_pdf_parsing(parsed_data=parsed_data)

        return preprocessed_text
