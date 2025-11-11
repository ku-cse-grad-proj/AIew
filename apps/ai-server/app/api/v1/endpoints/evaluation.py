from fastapi import (
    APIRouter, 
    Depends,
    Header,
    Body
)
from langchain.memory import ConversationBufferMemory

from app.services.memory_logger import MemoryManager
from app.models.evaluation import (
    AnswerEvaluationRequest, 
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.services.answer_evaluator import EvaluationService

router = APIRouter()


@router.post(
    "/answer-evaluating", 
    response_model=AnswerEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate User Answer"
)
def evaluate_answer(
    x_session_id: str = Header(...),
    req: AnswerEvaluationRequest = Body(...), 
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> AnswerEvaluationResult:
    
    service = EvaluationService(
        memory=memory, 
        session_id=x_session_id
    )

    return service.evaluate_answer(
        req, 
        memory
    )


@router.post(
    "/session-evaluating", 
    response_model=SessionEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate Entire Session"
)
def evaluate_session(
    x_session_id: str = Header(...),
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> SessionEvaluationResult:

    service = EvaluationService(
        memory=memory,
        session_id=x_session_id
    )
        
    return service.evaluate_session(memory)
