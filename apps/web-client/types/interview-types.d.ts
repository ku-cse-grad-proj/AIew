// types/interview-types.d.ts
declare global {
  // 이벤트 타입 리터럴
  type QuestionsEventType = 'server:questions-ready'

  // 질문 카테고리 (필요시 확장)
  type QuestionCategory = 'technical' | 'personality' | 'tailored'

  // 카테고리별 질문 구조: "질문 묶음"들의 배열 (각 묶음은 string[] 질문 리스트)
  type QuestionBundles = string[][]

  // payload의 questions 필드 타입
  type QuestionsMap = Record<QuestionCategory, QuestionBundles>

  // interview 상태
  type InterviewStatus =
    | 'PENDING'
    | 'READY'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED'
}

export {}
