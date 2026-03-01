from typing import List

from fastapi import APIRouter, Body, Depends, Header
from langchain_core.chat_history import BaseChatMessageHistory

from app.models.question import QuestionRequest, QuestionResponse
from app.services.memory_logger import MemoryManager
from app.services.question_generator import QuestionGeneratorService
from app.utils.langfuse_handler import build_langfuse_config

router = APIRouter()


@router.post(
    "/question-generating",
    response_model=List[QuestionResponse],
    tags=["Question"],
    summary="Generate Interview Questions",
)
def generate_question(
    x_session_id: str = Header(...),
    req: QuestionRequest = Body(...),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> List[QuestionResponse]:
    service = QuestionGeneratorService(memory=memory, session_id=x_session_id)
    run_config = build_langfuse_config(session_id=x_session_id, tags=["question-gen"])

    return service.generate_questions(
        req.user_info, req.constraints, run_config=run_config
    )
