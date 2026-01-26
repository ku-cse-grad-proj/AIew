from fastapi import APIRouter, Body, Depends, Header
from langchain_core.chat_history import BaseChatMessageHistory

from app.models.evaluation import (
    AnswerEvaluationRequest,
    AnswerEvaluationResult,
    SessionEvaluationResult,
)
from app.services.answer_evaluator import EvaluationService
from app.services.memory_logger import MemoryManager

router = APIRouter()


@router.post(
    "/answer-evaluating",
    response_model=AnswerEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate User Answer",
)
def evaluate_answer(
    x_session_id: str = Header(...),
    req: AnswerEvaluationRequest = Body(...),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> AnswerEvaluationResult:
    service = EvaluationService(memory=memory, session_id=x_session_id)

    return service.evaluate_answer(req)


@router.post(
    "/session-evaluating",
    response_model=SessionEvaluationResult,
    tags=["Evaluation"],
    summary="Evaluate Entire Session",
)
def evaluate_session(
    x_session_id: str = Header(...),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> SessionEvaluationResult:
    service = EvaluationService(memory=memory, session_id=x_session_id)

    return service.evaluate_session()
