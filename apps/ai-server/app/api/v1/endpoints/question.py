from typing import List

from fastapi import APIRouter, Depends
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.question import (
    InterviewQuestion, 
    QuestionRequest
)
from app.services.question_generator import generate_questions

router = APIRouter()

@router.post(
    "/question-generating", 
    response_model=List[InterviewQuestion]
)
def generate_question(
        req: QuestionRequest, 
        memory: ConversationBufferMemory = Depends(MemoryDep)
):
    
    data = generate_questions(
        req.user_info, 
        req.constraints, 
        memory
    )
    return data