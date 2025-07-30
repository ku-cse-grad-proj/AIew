# pdf 타입 검사 (디지털 / 이미지)
import fitz


def is_digital_pdf(file_bytes: bytes) -> bool:
    doc = fitz.open("pdf", file_bytes)
    for page in doc:
        if page.get_text("text").strip():
            return True
    return False
