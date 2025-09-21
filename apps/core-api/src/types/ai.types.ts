/**
 * AI 서버가 생성하는 질문의 유형
 */
export enum AiQuestionCategory {
  BEHAVIORAL = 'behavioral', // 인성
  TECHNICAL = 'technical', // 기술
  TAILORED = 'tailored', // 맞춤
}

/**
 * AI 서버의 /question-generating 엔드포인트 응답 객체 타입
 */
export interface AiInterviewQuestion {
  main_question_id: string
  category: AiQuestionCategory
  criteria: string[]
  skills: string[]
  rationale: string
  question: string
  estimated_answer_time_sec: number
}

/**
 * AI 서버의 /question-generating 엔드포인트 전체 응답 타입
 */
export type QuestionGenerateResponse = AiInterviewQuestion[]

/**
 * AI 서버 /question-generating 요청의 user_info 필드 타입
 */
export interface AiUserInfo {
  desired_role: string
  company: string
  core_values: string
  resume_text: string
  portfolio_text: string
}

/**
 * AI 서버 /question-generating 요청의 constraints 필드 타입
 */
export interface AiQuestionConstraints {
  language?: string
  n?: number
  timebox_total_sec?: number
  avoid_question_ids?: string[]
  seed?: number
}

/**
 * AI 서버 /question-generating 엔드포인트 요청 본문 전체 타입
 */
export interface AiQuestionRequest {
  user_info: AiUserInfo
  constraints?: AiQuestionConstraints
}

// --- 답변 평가 및 꼬리 질문 관련 타입 ---

/**
 * AI 서버의 꼬리 질문 생성 여부 결정 타입
 */
export enum TailDecision {
  CREATE = 'create',
  SKIP = 'skip',
}

/**
 * AI 서버의 세부 평가 기준 점수 객체 타입
 */
export interface CriterionScore {
  name: string
  score: number
  reason: string
}

/**
 * AI 서버의 /answer-evaluating 엔드포인트 응답 객체 타입
 */
export interface AnswerEvaluationResult {
  question_id: string
  category: string
  answer_duration_sec: number
  overall_score: number
  strengths: string[]
  improvements: string[]
  red_flags: string[]
  criterion_scores: CriterionScore[]
  feedback: string
  tail_decision: TailDecision
  tail_rationale: string | null
}

/**
 * AI 서버의 /session-evaluating 엔드포인트 응답 객체 타입
 */
export interface SessionEvaluationResult {
  average_score: number
  session_feedback: string
}

/**
 * AI 서버의 /answer-evaluating 엔드포인트 요청 본문 타입
 */
export interface AnswerEvaluationRequest {
  question_id: string
  category: string
  criteria: string[]
  skills: string[]
  question_text: string
  user_answer: string
  answer_duration_sec: number
  remaining_time_sec?: number
  remaining_main_questions?: number
  use_tailored_category?: boolean
}

/**
 * AI 서버가 생성하는 꼬리 질문 객체 타입
 */
export interface FollowUp {
  followup_id: string
  parent_question_id: string
  focus_criteria: string[]
  rationale: string
  question: string
  expected_answer_time_sec: number
}

/**
 * AI 서버의 /followup-generating 엔드포인트 요청 본문 타입
 */
export interface FollowupRequest {
  question_id: string
  category: string
  question_text: string
  criteria: string[]
  skills: string[]
  user_answer: string
  evaluation_summary?: string
  remaining_time_sec?: number
  remaining_main_questions?: number
  depth?: number
  use_tailored_category?: boolean
  auto_sequence?: boolean
  next_followup_index?: number
}

// --- AI 서버 메모리 로깅 관련 타입 ---

/**
 * AI 서버의 /log/question-shown 엔드포인트 요청 본문 타입
 */
export interface ShownQuestion {
  question: {
    [key: string]: unknown
  }
}

/**
 * AI 서버의 /log/user-answer 엔드포인트 요청 본문 타입
 */
export interface UserAnswer {
  question_id: string
  answer: string
  answer_duration_sec: number
}

/**
 * AI 서버의 /memory/dump 엔드포인트 응답의 메시지 객체 타입
 */
export interface MemoryMessage {
  role: 'human' | 'ai' | 'system'
  content: string
}

/**
 * AI 서버의 /memory/dump 엔드포인트 응답 전체 타입
 */
export interface MemoryDump {
  session_id: string
  history_str: string
  messages: MemoryMessage[]
}
