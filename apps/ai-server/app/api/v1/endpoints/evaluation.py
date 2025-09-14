from fastapi import APIRouter, Depends
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


@router.post("/answer-evaluating", response_model=AnswerEvaluationResult)
def evaluate_answer(
    req: AnswerEvaluationRequest, memory: ConversationBufferMemory = Depends(MemoryDep)
):
    return evaluate_answer_service(req, memory)

@router.post("/session-evaluating", response_model=SessionEvaluationResult)
def evaluate_session(
    memory: ConversationBufferMemory = Depends(MemoryDep)
):
    return evaluate_session_service(memory)