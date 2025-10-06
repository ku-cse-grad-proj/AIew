import json
import os
import tempfile

from fastapi import APIRouter, Depends, File, Header, UploadFile
from langchain.memory import ConversationBufferMemory

from app.core.memory import get_memory
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

            output_dir = os.path.join("C:/AIew/apps/ai-server/app/result")
            if not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)

            output_path = os.path.join(output_dir, f"{file.filename}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

        return {
            "status": "ok",
            "frames_processed": taken,
            "items_logged": len(results),
            "filename": file.filename,
        }

    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
