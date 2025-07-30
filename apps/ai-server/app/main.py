# from dotenv import load_dotenv
from fastapi import FastAPI

from app.api.v1.endpoints import pdf

app = FastAPI()

app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["pdf"])


@app.get("/")
def read_root():
    return {"message": "AIew API is running"}
