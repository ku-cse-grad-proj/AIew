import json
import os
import tempfile
from typing import (
    Any, 
    Dict
)

from fastapi import (
    APIRouter, 
    Depends, 
    File, 
    Header, 
    UploadFile
)
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.utils.video_analysis import video_analysis
from app.models.emotion import (
    EmotionGroupResult, 
    EmotionGroupScore
)

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

        results, taken = video_analysis(tmp_path)

        if results:
            payload: Dict[str, Any] = {
                "filename": file.filename, 
                "results": results
            }
            memory.chat_memory.add_user_message(
                "[FACE_ANALYSIS]" + json.dumps(payload, ensure_ascii=False)
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
