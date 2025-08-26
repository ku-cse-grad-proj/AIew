/**
 * ai-server의 /question-generating 응답 모델에 대응하는 타입
 */

// ai-server의 QuestionType Enum
export enum AiQuestionCategory {
  BEHAVIORAL = 'behavioral', // 인성
  TECHNICAL = 'technical', // 기술
  TAILORED = 'tailored', // 맞춤
}

// ai-server의 InterviewQuestion 모델
export interface AiInterviewQuestion {
  main_question_id: string
  category: AiQuestionCategory
  criteria: string[]
  skills: string[]
  rationale: string | null
  question: string // question_text가 question으로 alias 처리됨
  estimated_answer_time_sec: number | null
}

export type QuestionGenerateResponse = AiInterviewQuestion[]
