from fastapi import APIRouter, Depends
from langchain.memory import ConversationBufferMemory

from app.models.evaluation import AnswerEvaluationRequest, EvaluationResult
from app.services.answer_evaluator import evaluate_answer as evaluate_answer_service
from app.api.v1.endpoints.memory_debug import MemoryDep


router = APIRouter()

@router.post("/answer-evaluating", response_model=EvaluationResult)
def evaluate_answer(
    req: AnswerEvaluationRequest, 
    memory: ConversationBufferMemory = Depends(MemoryDep)
):
    return evaluate_answer_service(req, memory)