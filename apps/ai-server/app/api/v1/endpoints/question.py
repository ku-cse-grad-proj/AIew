from typing import List
from fastapi import APIRouter, Depends
from langchain.memory import ConversationBufferMemory

from app.models.question import InterviewQuestion, QuestionRequest
from app.services.question_generator import generate_questions
from app.api.v1.endpoints.memory_debug import MemoryDep

router = APIRouter()

@router.post("/question-generating", response_model=List[InterviewQuestion])
def generate_question(req: QuestionRequest, memory: ConversationBufferMemory = Depends(MemoryDep)):
    data = generate_questions(req.user_info, req.constraints.model_dump(), memory)
    return data
