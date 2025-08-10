from fastapi import FastAPI

from app.api.v1.endpoints import pdf, question, memory_debug, session_log

app = FastAPI()

app.include_router(session_log.router, prefix="/api/v1/session-log", tags=["session_log"])
app.include_router(memory_debug.router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["pdf"])
app.include_router(question.router, prefix="/api/v1/question", tags=["question"])

@app.get("/")
def read_root():
    return {"message": "AIew API is running"}
