from pydantic import BaseModel


class PDFUploadResponse(BaseModel):
    filename: str
    extracted_text: str
