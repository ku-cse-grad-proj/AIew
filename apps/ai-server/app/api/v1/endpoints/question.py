from fastapi import APIRouter
from typing import List
from app.services.question_generator import generate_questions
from app.models.question import QuestionRequest, InterviewQuestion

router = APIRouter()


@router.post("/question-generating", response_model=List[InterviewQuestion])
def generate_question(req: QuestionRequest):
    question = generate_questions(req.user_info)
    return question
