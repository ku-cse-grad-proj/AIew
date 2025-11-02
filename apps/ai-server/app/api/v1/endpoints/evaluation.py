from fastapi import (
    APIRouter, 
    Depends,
    Header,
    Body
)
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.evaluation import (
    AnswerEvaluationRequest, 
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.services.answer_evaluator import EvaluationService

router = APIRouter()


@router.post(
    "/evaluate-answer", 
    response_model=AnswerEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate User Answer"
)
def evaluate_answer(
    x_session_id: str = Header(...),
    req: AnswerEvaluationRequest = Body(...), 
    memory: ConversationBufferMemory = Depends(MemoryDep)
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
    "/evaluate-session", 
    response_model=SessionEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate Entire Session"
)
def evaluate_session(
    x_session_id: str = Header(...),
    memory: ConversationBufferMemory = Depends(MemoryDep)
) -> SessionEvaluationResult:

    service = EvaluationService(
        memory=memory,
        session_id=x_session_id
    )
        
    return service.evaluate_session(memory)
