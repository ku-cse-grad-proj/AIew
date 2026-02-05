from fastapi import APIRouter, File, UploadFile

from app.models.pdf import PDFUploadResponse
from app.services.pdf_processor import PDFAnalysisService

router = APIRouter()


@router.post(
    "/pdf-text-parsing",
    response_model=PDFUploadResponse,
    tags=["PDF"],
    summary="Upload PDF and extract preprocessed text",
)
async def parse_pdf(
    file: UploadFile = File(..., description="PDF file to be parsed"),
) -> PDFUploadResponse:
    file_bytes = await file.read()

    service = PDFAnalysisService()

    if not file.filename:
        file.filename = ""

    results = service.process_and_persist(
        file_bytes=file_bytes, file_name=file.filename
    )

    return PDFUploadResponse(filename=file.filename, extracted_text=results)
