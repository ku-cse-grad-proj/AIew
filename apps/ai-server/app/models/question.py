from pydantic import BaseModel, Field


class UserInfo(BaseModel):
    desired_role: str = Field(..., description="희망 직무")
    core_values: str = Field(..., description="회사 인재상")
    resume_text: str = Field(..., description="자기소개서 텍스트", max_length=20000)
    portfolio_text: str = Field(..., description="포트폴리오 텍스트", max_length=20000)

class QuestionRequest(BaseModel):
    user_info: UserInfo

class InterviewQuestion(BaseModel):
    main_question_id: str
    question: str
    question_type: str
    criteria: str
