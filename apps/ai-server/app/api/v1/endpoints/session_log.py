import logging

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
)
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_redis import RedisChatMessageHistory

from app.models.memory import (
    AnswerReceivedRequest,
    QuestionAskedRequest,
    RestoreRequest,
)
from app.services.memory_logger import MemoryLogger, MemoryManager

logger = logging.getLogger(__name__)

router = APIRouter()


def get_memory_logger_dep(
    x_session_id: str = Header(..., description="세션 고유 ID"),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> MemoryLogger:
    return MemoryLogger(memory=memory, session_id=x_session_id)


@router.post("/refresh-ttl", tags=["Session"], summary="Refresh Redis TTL")
def refresh_ttl(
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
    x_session_id: str = Header(...),
):
    if not isinstance(memory, RedisChatMessageHistory):
        # in-memory fallback 지원
        return {"ok": True, "refreshed": 0}

    ttl: int = memory.ttl or MemoryManager._ttl
    pattern = f"{memory.key_prefix}{memory.session_id}:*"
    refreshed = 0
    cursor: int = 0
    while True:
        cursor, keys = memory.redis_client.scan(  # type: ignore[misc]
            cursor=cursor, match=pattern, count=100
        )
        if keys:
            pipe = memory.redis_client.pipeline()
            for key in keys:
                pipe.expire(key, ttl)
            pipe.execute()
            refreshed += len(keys)
        if cursor == 0:
            break

    logger.info(f"[{x_session_id}] TTL refreshed for {refreshed} keys")
    return {"ok": True, "refreshed": refreshed}


@router.post("/log/question-asked", tags=["Session"], summary="Log Question Asked")
def post_question_asked(
    payload: QuestionAskedRequest,
    memory_logger: MemoryLogger = Depends(get_memory_logger_dep),
) -> dict:
    try:
        memory_logger.log_question_asked(payload.model_dump())
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to log question asked: {str(e)}"
        )


@router.post("/log/answer-received", tags=["Session"], summary="Log Answer Received")
def post_answer_received(
    payload: AnswerReceivedRequest,
    memory_logger: MemoryLogger = Depends(get_memory_logger_dep),
) -> dict:
    try:
        memory_logger.log_answer_received(
            {
                "aiQuestionId": payload.aiQuestionId,
                "answer": payload.answer,
                "answerDurationSec": payload.answerDurationSec,
            }
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to log answer received: {str(e)}"
        )


@router.post("/restore", tags=["Session"], summary="Restore Session Memory from DB")
def restore_memory(
    payload: RestoreRequest,
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
    x_session_id: str = Header(...),
) -> dict:
    try:
        logger.info(
            f"[{x_session_id}] Restoring memory with {len(payload.steps)} steps"
        )

        # 1. 기존 메모리 초기화
        memory.clear()

        memory_logger = MemoryLogger(memory=memory, session_id=x_session_id)

        # 2. 각 스텝 순회하며 로깅
        for step in payload.steps:
            # QUESTION_ASKED 로깅 (메인/꼬리 통합, parentQuestionId로 구분)
            question_data = {
                "aiQuestionId": step.aiQuestionId,
                "question": step.question,
                "type": step.type,
                "criteria": step.criteria,
                "skills": step.skills,
                "rationale": step.rationale,
                "estimatedAnswerTimeSec": step.estimatedAnswerTimeSec,
            }
            if step.parentQuestionId:
                question_data["parentQuestionId"] = step.parentQuestionId
            memory_logger.log_question_asked(question_data)

            # 답변이 있으면 ANSWER_RECEIVED 로깅
            if step.answer is not None:
                memory_logger.log_answer_received(
                    {
                        "aiQuestionId": step.aiQuestionId,
                        "answer": step.answer,
                        "answerDurationSec": step.answerDurationSec or 0,
                    }
                )

            # 평가가 있으면 ANSWER_EVALUATED 로깅
            if step.evaluation is not None:
                memory_logger.log_answer_evaluated(step.evaluation.model_dump())

            logger.info(f"[{x_session_id}] Step {step.aiQuestionId} restored")

        logger.info(f"[{x_session_id}] Memory restore completed successfully")
        return {"ok": True, "restored_steps": len(payload.steps)}
    except Exception as e:
        logger.error(f"[{x_session_id}] Failed to restore memory: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to restore memory: {str(e)}"
        )
