from typing import List

from fastapi import APIRouter

from app.models.question import InterviewQuestion, QuestionRequest
from app.services.question_generator import generate_questions

router = APIRouter()


@router.post("/question-generating", response_model=List[InterviewQuestion])
def generate_question(req: QuestionRequest):
    question = generate_questions(req.user_info)
    return question
