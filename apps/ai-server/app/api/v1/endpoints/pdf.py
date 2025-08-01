from fastapi import APIRouter, File, UploadFile

from app.models.pdf import PDFUploadResponse
from app.services.ocr_parser import extract_text_from_image_pdf
from app.services.pdf_parser import extract_text_from_digital_pdf
from app.utils.file_check import is_digital_pdf
from app.services.preprocessor import preprocess_text

router = APIRouter()


@router.post("/pdf-text-parsing", response_model=PDFUploadResponse)
async def parse_pdf_text(file: UploadFile = File(...)):
    file_bytes = await file.read()

    if is_digital_pdf(file_bytes):
        extracted_text = extract_text_from_digital_pdf(file_bytes)
    else:
        extracted_text = extract_text_from_image_pdf(file_bytes)

    preprocessed_sentences = preprocess_text(extracted_text)

    return PDFUploadResponse(filename=file.filename, extracted_text=preprocessed_sentences)
