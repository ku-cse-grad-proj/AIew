from app.utils.pdf_utils import (
    extract_text_from_digital_pdf,
    extract_text_from_image_pdf,
    is_digital_pdf,
    preprocess_text,
)


class PDFAnalysisService:
    def __init__(self) -> None:
        pass

    def process_and_persist(self, file_bytes: bytes = b"", file_name: str = "") -> str:
        is_digital = is_digital_pdf(file_bytes)
        extracted_text = (
            extract_text_from_digital_pdf(file_bytes)
            if is_digital
            else extract_text_from_image_pdf(file_bytes)
        )

        preprocessed_lines = preprocess_text(extracted_text)
        preprocessed_text = "\n".join(preprocessed_lines)

        return preprocessed_text
