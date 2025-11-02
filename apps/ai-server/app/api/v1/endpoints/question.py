from typing import List

from fastapi import (
    APIRouter, 
    Depends,
    Header,
    Body
)
from langchain.memory import ConversationBufferMemory

from app.services.memory_logger import MemoryManager
from app.models.question import (
    QuestionRequest,
    QuestionResponse
)
from app.services.question_generator import QuestionGeneratorService

router = APIRouter()


@router.post(
    "/generate-question", 
    response_model=List[QuestionResponse],
    tags=["Question"],
    summary="Generate Interview Questions"
)
def generate_question(
    x_session_id: str = Header(...),
    req: QuestionRequest = Body(...), 
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> List[QuestionResponse]:
    
    service = QuestionGeneratorService(
        memory=memory, 
        session_id=x_session_id
    )
    
    return service.generate_questions(
        req.user_info, 
        req.constraints, 
        memory=memory
    )