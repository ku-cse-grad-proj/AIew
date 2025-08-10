import json
from fastapi import APIRouter, File, UploadFile, Depends
from langchain.memory import ConversationBufferMemory

from app.models.pdf import PDFUploadResponse
from app.services.ocr_parser import extract_text_from_image_pdf
from app.services.pdf_parser import extract_text_from_digital_pdf
from app.services.preprocessor import preprocess_text
from app.utils.file_check import is_digital_pdf
from app.api.v1.endpoints.memory_debug import MemoryDep

router = APIRouter()


@router.post("/pdf-text-parsing", response_model=PDFUploadResponse)
async def parse_pdf_text(file: UploadFile = File(...), memory: ConversationBufferMemory = Depends(MemoryDep), ):
    file_bytes = await file.read()

    digital = is_digital_pdf(file_bytes)
    extracted_text = (
        extract_text_from_digital_pdf(file_bytes)
        if digital else
        extract_text_from_image_pdf(file_bytes)
    )
    
    preprocessed_sentences = preprocess_text(extracted_text)

    try:
        preview = ""
        if isinstance(extracted_text, str):
            preview = extracted_text[:400] + ("…" if len(extracted_text) > 400 else "")
        memory.save_context(
            {"input": "[PDF_PARSE]"},
            {"output": json.dumps({
                "filename": file.filename,
                "digital": digital,
                "chars": len(extracted_text) if isinstance(extracted_text, str) else None,
                "sentences": len(preprocessed_sentences) if isinstance(preprocessed_sentences, list) else None,
                "preview": preview
            }, ensure_ascii=False)}
        )
    except Exception:
        # 메모리 로깅 실패해도 파싱 결과는 반환
        pass

    return PDFUploadResponse(
        filename=file.filename, extracted_text=preprocessed_sentences
    )
