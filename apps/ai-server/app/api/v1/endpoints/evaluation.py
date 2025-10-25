from fastapi import (
    APIRouter, 
    Depends
)
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.evaluation import (
    AnswerEvaluationRequest, 
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.services.answer_evaluator import (
    evaluate_answer as evaluate_answer_service,
    evaluate_session as evaluate_session_service
)

router = APIRouter()


@router.post(
    "/evaluate-answer", 
    response_model=AnswerEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate User Answer"
)
def evaluate_answer(
    req: AnswerEvaluationRequest, 
    memory: ConversationBufferMemory = Depends(MemoryDep)
) -> AnswerEvaluationResult:
    
    return evaluate_answer_service(
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
    memory: ConversationBufferMemory = Depends(MemoryDep)
) -> SessionEvaluationResult:

    return evaluate_session_service(memory)