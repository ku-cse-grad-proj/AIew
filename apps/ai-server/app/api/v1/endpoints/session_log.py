from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
)
from langchain.memory import ConversationBufferMemory

from app.models.memory import RestoreRequest, ShownQuestion, UserAnswer
from app.services.memory_logger import MemoryLogger, MemoryManager

router = APIRouter()


def get_memory_logger_dep(
    x_session_id: str = Header(..., description="세션 고유 ID"),
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep),
) -> MemoryLogger:
    return MemoryLogger(memory=memory, session_id=x_session_id)


@router.post("/log/question-shown", tags=["Session"], summary="Log Shown Question")
def post_question_shown(
    payload: ShownQuestion, logger: MemoryLogger = Depends(get_memory_logger_dep)
) -> dict:
    try:
        logger.log_shown_question(payload.question)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to log shown question: {str(e)}"
        )


@router.post("/log/user-answer", tags=["Session"], summary="Log User Answer")
def post_user_answer(
    payload: UserAnswer, logger: MemoryLogger = Depends(get_memory_logger_dep)
) -> dict:
    try:
        logger.log_user_answer(
            payload.question_id, payload.answer, payload.answer_duration_sec
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to log user answer: {str(e)}"
        )


@router.post("/restore", tags=["Session"], summary="Restore Session Memory from DB")
def restore_memory(
    payload: RestoreRequest,
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep),
    x_session_id: str = Header(...),
) -> dict:
    try:
        # 1. 기존 메모리 초기화
        memory.clear()

        logger = MemoryLogger(memory=memory, session_id=x_session_id)

        # 2. PDF 파싱 로깅
        logger.log_pdf_parsing(
            {"file_name": "resume", "extracted_text": payload.resume_text}
        )
        logger.log_pdf_parsing(
            {"file_name": "portfolio", "extracted_text": payload.portfolio_text}
        )

        # 3. 각 스텝 순회하며 로깅
        for step in payload.steps:
            # 꼬리질문인 경우 TAIL_QUESTION 먼저 로깅
            if step.is_followup:
                logger.log_tail_question(
                    {
                        "followup_id": step.question_id,
                        "parent_question_id": step.parent_question_id,
                        "focus_criteria": step.focus_criteria or [],
                        "rationale": step.rationale or "",
                        "question": step.question_text,
                        "expected_answer_time_sec": step.estimated_answer_time_sec
                        or 180,
                    }
                )

            # QUESTION_SHOWN 로깅
            logger.log_shown_question(
                {
                    "main_question_id": step.question_id,
                    "category": step.category,
                    "question_text": step.question_text,
                    "criteria": step.criteria,
                    "skills": step.skills,
                    "rationale": step.rationale,
                    "estimated_answer_time_sec": step.estimated_answer_time_sec,
                }
            )

            # 답변이 있으면 USER_ANSWER 로깅
            if step.answer is not None:
                logger.log_user_answer(
                    step.question_id, step.answer, step.answer_duration_sec or 0
                )

            # 평가가 있으면 ANSWER_EVALUATION 로깅
            if step.evaluation is not None:
                logger.log_evaluation(step.evaluation.model_dump())

        return {"ok": True, "restored_steps": len(payload.steps)}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to restore memory: {str(e)}"
        )
