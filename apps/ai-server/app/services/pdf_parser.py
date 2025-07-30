# 디지털 pdf 파싱
from io import BytesIO

import fitz  # PyMuPDF


def extract_text_from_digital_pdf(file_bytes: bytes) -> str:
    with fitz.open(stream=BytesIO(file_bytes), filetype="pdf") as doc:
        text = ""
        for page in doc:
            text += page.get_text()
        return text
