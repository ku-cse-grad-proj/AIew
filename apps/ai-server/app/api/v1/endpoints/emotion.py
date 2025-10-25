import json
import os
import tempfile

from fastapi import APIRouter, Depends, File, Header, UploadFile
from langchain.memory import ConversationBufferMemory

from app.core.memory import get_memory
from app.models.emotion import EmotionGroupResult, EmotionGroupScore
from app.utils.video_analysis import video_analysis

router = APIRouter()


def MemoryDep(x_session_id: str = Header(...)) -> ConversationBufferMemory:
    return get_memory(x_session_id)


@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    memory: ConversationBufferMemory = Depends(MemoryDep),
    x_session_id: str = Header(...),
):
    """
    영상 파일 업로드 → 영상 분석 → 메모리에 결과 저장 + 결과 JSON 파일 저장
    """
    suffix = os.path.splitext(file.filename or "")[-1] or ".mp4"
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)

    try:
        with os.fdopen(tmp_fd, "wb") as f:
            f.write(await file.read())

        results, taken = video_analysis(tmp_path)

        if results:
            payload = {"filename": file.filename, "results": results}

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
