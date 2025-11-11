from fastapi import (
    APIRouter,
    Depends, 
    HTTPException,
    Header,
)
from langchain.memory import ConversationBufferMemory

from app.models.memory import (
    ShownQuestion, 
    UserAnswer
)
from app.services.memory_logger import MemoryLogger, MemoryManager

router = APIRouter()

def get_memory_logger_dep(
    x_session_id: str = Header(..., description="세션 고유 ID"),
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> MemoryLogger:

    return MemoryLogger(
        memory=memory,
        session_id=x_session_id
    )
    
@router.post(
    "/log/question-shown",
    tags=["Session"],
    summary="Log Shown Question"
)
def post_question_shown(
    payload: ShownQuestion, 
    logger: MemoryLogger = Depends(get_memory_logger_dep)
) -> dict:
    
    try:
        logger.log_shown_question(
            payload.question
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to log shown question: {str(e)}"
        )

@router.post(
    "/log/user-answer",
    tags=["Session"],
    summary="Log User Answer"
)
def post_user_answer(
    payload: UserAnswer, 
    logger: MemoryLogger = Depends(get_memory_logger_dep)
) -> dict:
    
    try:
        logger.log_user_answer(
            payload.question_id, 
            payload.answer, 
            payload.answer_duration_sec
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to log user answer: {str(e)}"
        )
