from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from langchain.memory import ConversationBufferMemory

from app.core.memory import get_memory
from app.services.memory_logger import log_shown_question, log_user_answer


router = APIRouter()

def MemoryDep(x_session_id: str = Header(default=None)) -> ConversationBufferMemory:
    """X-Session-Id 헤더로 세션별 메모리 주입"""
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-Id header required")
    return get_memory(x_session_id)

class ShownQuestion(BaseModel):
    question: dict

    model_config = {
        "json_schema_extra": {
            "example": {
                "question": {
                    "main_question_id": "q2",
                    "category": "technical",
                    "criteria": ["명확성", "깊이", "근거"],
                    "skills": ["React", "TypeScript"],
                    "rationale": "컴포넌트 설계 역량 검증",
                    "question_text": "React와 TypeScript로 UI 컴포넌트를 설계할 때 고려하는 사항은?",
                    "estimated_answer_time_sec": 90
                }
            }
        }
    }

class UserAnswer(BaseModel):
    question_id: str = Field(..., pattern=r"^q\d+(-fu\d+)?$")
    answer: str
    answer_duration_sec: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "question_id": "q2",
                "answer": "컴포넌트는 작게 분리하고 제네릭 타입으로 인터페이스를 추상화합니다...",
                "answer_duration_sec": 72
            }
        }
    }

@router.post("/log/question-shown")
def post_question_shown(
    payload: ShownQuestion, 
    memory: ConversationBufferMemory = Depends(MemoryDep)
):
    log_shown_question(memory, payload.question)
    return  {"ok": True}

@router.post("/log/user-answer")
def post_user_answer(
    payload: UserAnswer, 
    memory: ConversationBufferMemory = Depends(MemoryDep)
):
    log_user_answer(
        memory, 
        payload.question_id, 
        payload.answer, 
        payload.answer_duration_sec
    )
    return {"ok": True}