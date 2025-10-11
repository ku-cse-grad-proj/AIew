# 이미지 pdf OCR 처리
import io

import fitz  # PyMuPDF
import pytesseract
from PIL import Image


def extract_text_from_image_pdf(file_bytes: bytes) -> str:
    doc = fitz.open("pdf", file_bytes)
    full_text = ""

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=300)
        img_data = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_data))

        text = pytesseract.image_to_string(image, lang="eng+kor")
        full_text += text + "\n"

    return full_text
