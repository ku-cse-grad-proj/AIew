from fastapi import FastAPI

from app.api.v1.endpoints import pdf, question

app = FastAPI()

app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["pdf"])
app.include_router(question.router, prefix="/api/v1/question", tags=["question"])


@app.get("/")
def read_root():
    return {"message": "AIew API is running"}
