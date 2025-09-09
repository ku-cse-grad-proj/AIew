from fastapi import APIRouter, File, UploadFile
from app.models.face_expression import FaceExpressionsResponse
from app.services.face_evaluation_service import FaceEvaluationService
import tempfile
import os

router = APIRouter()
face_evaluation_service = FaceEvaluationService()

@router.post("/face-expression", response_model=FaceExpressionsResponse)
async def detect_face_expression(file: UploadFile = File(...)):
    """
    업로드된 이미지 파일에서 얼굴 표정, 시선, 자세를 분석합니다.
    """
    contents = await file.read()
    
    # 임시 파일에 이미지 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        # 통합 서비스의 평가 메서드 호출
        results = face_evaluation_service.evaluate_interview(temp_path, image_id=file.filename)
    finally:
        # 임시 파일 삭제
        os.remove(temp_path)
    
    return results