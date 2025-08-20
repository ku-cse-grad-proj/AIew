from fastapi import FastAPI

from app.api.v1.endpoints import (
    evaluation,
    followup,
    memory_debug,
    pdf,
    question,
    session_log,
)

app = FastAPI()

app.include_router(
    session_log.router, prefix="/api/v1/session-log", tags=["Session Log"]
)
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["PDF"])
app.include_router(question.router, prefix="/api/v1/question", tags=["Question"])
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
app.include_router(followup.router, prefix="/api/v1/followup", tags=["Question"])
app.include_router(
    memory_debug.router, prefix="/api/v1/memory-debug", tags=["Memory Debug"]
)


@app.get("/")
def read_root():
    return {"message": "AIew API is running"}
