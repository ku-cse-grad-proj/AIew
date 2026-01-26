from fastapi import APIRouter, Depends, File, Header, UploadFile
from langchain_core.chat_history import BaseChatMessageHistory

from app.models.pdf import PDFUploadResponse
from app.services.memory_logger import MemoryManager
from app.services.pdf_processor import PDFAnalysisService

router = APIRouter()


@router.post(
    "/pdf-text-parsing",
    response_model=PDFUploadResponse,
    tags=["PDF"],
    summary="Upload PDF and extract preprocessed text",
)
async def parse_pdf(
    x_session_id: str = Header(...),
    file: UploadFile = File(..., description="PDF file to be parsed"),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> PDFUploadResponse:
    file_bytes = await file.read()

    service = PDFAnalysisService(memory=memory, session_id=x_session_id)

    if not file.filename:
        file.filename = ""

    results = service.process_and_persist(
        file_bytes=file_bytes, file_name=file.filename
    )

    return PDFUploadResponse(filename=file.filename, extracted_text=results)
