from enum import Enum
from typing import List
from pydantic import (
    BaseModel, 
    Field
)


class UserInfo(BaseModel):
    desired_role: str = Field(..., description="희망 직무")
    company: str = Field(..., description="지원 회사명")
    core_values: str = Field(..., description="회사 인재상")
    resume_text: str = Field(..., description="자기소개서 텍스트", max_length=20000)
    portfolio_text: str = Field(..., description="포트폴리오 텍스트", max_length=20000)


class QuestionConstraints(BaseModel):
    language: str = Field("ko", description="질문 출력 언어: ko")
    n: int = Field(5, ge=5, le=5, description="메인 질문 개수(고정 5)")
    timebox_total_sec: int = Field(None, description="면접 총 시간(초)")
    avoid_question_ids: List[str] = Field(default_factory=list, description="이미 출제된 질문 ID 목록(중복 방지)")
    seed: int = Field(None, description="결정적 생성용 시드(모델 지원 시)")


class QuestionRequest(BaseModel):
    user_info: UserInfo
    constraints: QuestionConstraints = Field(
        default_factory=lambda: QuestionConstraints(),
        description="질문 생성 제약 조건"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "constraints": {
                    "avoid_question_ids": [],
                    "language": "ko",
                    "n": 5,
                    "seed": 42,
                    "timebox_total_sec": 1200
                },
                "user_info": {
                    "core_values": "창의적인 인재",
                    "company": "AI Corp",
                    "desired_role": "프론트엔드 엔지니어",
                    "resume_text": "1. [지원 동기] 저는 프론트엔드 개발이 단순히 화면을 만드는 작업이 아니라,  사용자가 제품과 만나는 첫 관문이라고 생각합니다. 대학 시절 학습관리시스템(LMS) UI를 리뉴얼하는 프로젝트에 참여하며, 단순한 디자인 변경이 아닌 사용자의 학습 몰입도를 높이는 구조와 기능을 고민했습니다.  이 과정에서 React와 TypeScript를 본격적으로 익히게 되었고,  ‘사용자 경험 최적화’라는 목표가 제 커리어의 방향이 되었습니다.  귀사의 ‘창의적인 문제 해결’과 ‘팀워크’라는 핵심 가치가 제 개발 철학과 맞닿아 있다고 느껴 지원하게 되었습니다. 2. [본인의 강점] 저의 가장 큰 강점은 성능 최적화와 접근성 개선에 있습니다.  이전 전자상거래 대시보드 프로젝트에서는 React + Zustand를 활용해 리스트 렌더링 속도를 35% 개선하고, LCP를 2.4초에서 1.7초로 줄였습니다. 또한 Lighthouse 접근성 점수를 68점에서 94점으로 끌어올려, 더 많은 사용자가 불편 없이 서비스를 이용할 수 있게 했습니다.  문제 해결 시 데이터 기반 의사결정을 선호하며,  개선 사항을 정량적으로 측정해 팀과 공유합니다. 3. [성공적인 프로젝트 경험] FitPlanner  프로젝트에서 프론트엔드 리드를 맡아 공통 UI  컴포넌트 설계와 상태 관리 구조를 재정립했습니다.  이를 통해 개발 속도가 약 25%  향상되었고,  신규 기능 릴리즈 주기를 2주에서 1.5주로 단축했습니다.  특히 모바일 환경에서의 초기 로딩 속도를 28%  단축하여 사용자 평균 세션 시간이 14% 증가하는 성과를 얻었습니다. 4. [협업 경험] 저는 협업 시 ‘투명성’과 ‘일관성’을 중요하게 생각합니다.  Figma의 디자인 토큰을 코드에 자동 반영하는 파이프라인을 구축해 디자이너-개발자 간 싱크를 줄였고, PR 템플릿과 리뷰 규칙을 도입해 리뷰 리드타임을 평균 22% 단축했습니다. 또한 ADR 문서를 작성해 의사결정 과정을 명확히 기록함으로써 신규 팀원의 온보딩 시간을 절반으로 줄였습니다. 5. [기타 활동 및 성장 계획] 현재는 주 1회 기술 블로그를 운영하며 프론트엔드 성능 개선 사례, 접근성 체크리스트, 테스트 자동화 경험 등을 공유하고 있습니다. 앞으로는 서버 컴포넌트와 자동화된 접근성 검사 도입을 목표로 하고 있으며, 이를 통해 제품의 품질과 개발 효율성을 동시에 향상시키고자 합니다.",
                    "portfolio_text": "프로젝트 1: MyRecipe (개인 프로젝트) 기간: 2024.03 ~ 2024.05 역할: 기획, 디자인, 개발, 배포 전 과정 기술 스택: Next.js, TypeScript, React Query, Firebase(Auth/Firestore/Storage) 프로젝트 개요: 사용자가 직접 레시피를 작성, 검색, 공유할 수 있는 웹 애플리케이션입니다. 초기 목표는 검색 성능 개선과 모바일 UX 최적화였습니다. 성과: - 무한 스크롤 + 가상 리스트 적용으로 검색 결과 페이지 로딩 속도 42% 단축 - UI 리디자인 후 카드 클릭률(CTR) 14.3% 상승 - 접근성 개선(대체 텍스트, 폼 레이블 추가)으로 Lighthouse 점수 85 → 97 향상 - 월간 활성 사용자(MAU) 0 → 1,200명 도달(런칭 2개월 내) 프로젝트 2: FitPlanner (팀 프로젝트, 3인) 기간: 2024.06 ~ 2024.09 역할: 프론트엔드 리드, 공통 UI 컴포넌트 설계, 상태 관리 구조 재정립 기술 스택: Next.js(App Router), TypeScript, Zustand, Chart.js, Firebase, Cloud Functions 프로젝트 개요: 운동 루틴 계획, 기록, 분석 기능을 제공하는 PWA 기반 서비스입니다. 실시간 데이터 시각화와 오프라인 모드 지원이 핵심 기능입니다. 성과: - 코드 스플리팅 및 이미지 최적화로 TTI 28% 단축 - Firestore 스키마 최적화로 읽기 비용 31% 절감 - E2E 테스트 25개 시나리오 작성으로 주요 기능 오류율 40% 감소 - 모바일 사용자 세션 시간 평균 14% 증가 프로젝트 3: Dashboard-Plus (사이드 프로젝트) 기간: 2024.10 ~ 2024.11 역할: 단독 개발 기술 스택: React, Vite, TypeScript, Node.js, Express, Redis 프로젝트 개요: 사내 서비스 지표를 실시간으로 모니터링하고,  알림을 통해 이상 징후를 빠르게 파악할 수 있는 대시보드입니다. 성과: - API 응답 속도 p95 기준 420ms → 110ms로 개선(캐싱 + 인덱스 최적화) - 알림 임계값 조정으로 불필요한 알림 37% 감소 - 도입 후 장애 대응 평균 시간 18% 단축"
                }
            }
        }
    }

class QuestionType(str, Enum):
    behavioral = "behavioral"   # 인성
    technical = "technical"     # 기술
    tailored = "tailored"       # 맞춤


class QuestionResponse(BaseModel):
    main_question_id: str = Field(..., description="메인 질문 고유 ID (예: q1~q5)")
    category: QuestionType = Field(..., description="질문 유형: behavioral|technical|tailored")
    criteria: List[str] = Field(..., min_items=1, max_items=5, description="평가 기준 키워드 목록")
    skills: List[str] = Field(default_factory=list, max_items=5, description="측정 역량 태그")
    rationale: str = Field(None, description="질문 생선 전 근거")
    question_text: str = Field(..., description="질문 본문")
    estimated_answer_time_sec: int = Field(None, ge=10, le=600, description="예상 답변 시간(초)")
   
    model_config = {
        "json_schema_extra": {
            "example": {
                "main_question_id": "q1",
                "category": "technical",
                "criteria": ["명확성", "깊이", "근거"],
                "skills": ["React", "TypeScript"],
                "rationale": "성능·접근성 역량 검증",
                "question_text": "React 렌더링 최적화 경험을 설명해 주세요.",
                "estimated_answer_time_sec": 90
            }
        }
    }

