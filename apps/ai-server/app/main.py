import logging
import os
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI
from langfuse import Langfuse

from app.api.v1.endpoints import (
    emotion,
    evaluation,
    followup,
    memory_debug,
    pdf,
    question,
    session_log,
)

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            client = redis.from_url(redis_url)
            pong = await client.ping()  # type: ignore[misc]
            logger.info(f"Redis connected: {pong}")
            await client.aclose()
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
    else:
        logger.warning("REDIS_URL not configured, skipping Redis connection")

    yield
    # Shutdown
    Langfuse().shutdown()


app = FastAPI(title="AIew", version="1.0.0", lifespan=lifespan)

app.include_router(session_log.router, prefix="/api/v1/session-log", tags=["Session"])
app.include_router(memory_debug.router, prefix="/api/v1/memory-debug", tags=["Session"])
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["PDF"])
app.include_router(question.router, prefix="/api/v1/question", tags=["Question"])
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
app.include_router(followup.router, prefix="/api/v1/followup", tags=["Question"])
app.include_router(emotion.router, prefix="/api/v1/emotion", tags=["Emotion"])


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


class HealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "/healthz" not in record.getMessage()


logging.getLogger("uvicorn.access").addFilter(HealthCheckFilter())
