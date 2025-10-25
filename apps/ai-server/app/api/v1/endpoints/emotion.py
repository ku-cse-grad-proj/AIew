import os
import tempfile

from fastapi import (
    APIRouter, 
    Depends, 
    File, 
    Header, 
    UploadFile
)
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.emotion import (
    EmotionGroupResult, 
    EmotionGroupScore
)
from app.services.emotion_analyst import EmotionAnalysisService 

router = APIRouter()


@router.post(
    "/emotion-analyzing",
    response_model=EmotionGroupResult,
    tags=["Emotion"],
    summary="Upload Video and Analysis Emotion",
)
async def upload_video(
    x_session_id: str = Header(...),
    file: UploadFile = File(..., description="Video file to be analyzed"),
    memory: ConversationBufferMemory = Depends(MemoryDep),
) -> EmotionGroupResult:

    # 임시 파일 생성: 확장자를 유지하며 임시 파일을 생성합니다.
    suffix = os.path.splitext(file.filename or "")[-1] or ".mp4"
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)

    try:
        with os.fdopen(tmp_fd, "wb") as f:
            f.write(await file.read())

        service = EmotionAnalysisService(
            memory=memory, 
            session_id=x_session_id
        )
        
        results = service.process_and_persist(
            tmp_path, 
            file.filename
        )

        return EmotionGroupResult(
            file_name=file.filename,
            results=[EmotionGroupScore(**item) for item in results],
        )

    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
