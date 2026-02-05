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
  aiQuestionId: string
  type: string
  answerDurationSec: number
  overallScore: number
  strengths: string[]
  improvements: string[]
  redFlags: string[]
  criterionScores: CriterionScore[]
  feedback: string
  tailDecision: TailDecision
  tailRationale: string | null
}

/**
 * AI 서버의 /session-evaluating 엔드포인트 응답 객체 타입
 */
export interface SessionEvaluationResult {
  averageScore: number
  sessionFeedback: string
}

/**
 * AI 서버의 /answer-evaluating 엔드포인트 요청 본문 타입
 */
export interface AnswerEvaluationRequest {
  aiQuestionId: string
  type: string
  criteria: string[]
  skills: string[]
  questionText: string
  userAnswer: string
  answerDurationSec: number
}

/**
 * AI 서버가 생성하는 꼬리 질문 객체 타입
 */
export interface FollowUp {
  followupId: string
  parentQuestionId: string
  focusCriteria: string[]
  rationale: string
  question: string
  expectedAnswerTimeSec: number
}

/**
 * AI 서버의 /followup-generating 엔드포인트 요청 본문 타입
 */
export interface FollowupRequest {
  aiQuestionId: string
  type: string
  questionText: string
  criteria: string[]
  skills: string[]
  userAnswer: string
  evaluationSummary?: string
}

// --- AI 서버 메모리 로깅 관련 타입 ---

/**
 * AI 서버의 /log/question-asked 엔드포인트 요청 본문 타입
 */
export interface QuestionAskedRequest {
  aiQuestionId: string
  question: string
  type: string
  criteria: string[]
  skills: string[]
  rationale?: string | null
  estimatedAnswerTimeSec?: number | null
  parentQuestionId?: string | null // 꼬리질문인 경우
}

/**
 * AI 서버의 /log/answer-received 엔드포인트 요청 본문 타입
 */
export interface AnswerReceivedRequest {
  aiQuestionId: string
  answer: string
  answerDurationSec: number
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

// --- 메모리 복구 관련 타입 ---

/**
 * 평가 상세 기준 점수
 */
export interface CriterionScoreData {
  name: string
  score: number
  reason: string
}

/**
 * 답변 평가 데이터 (복구용)
 */
export interface EvaluationData {
  aiQuestionId: string
  type: string
  answerDurationSec: number
  overallScore: number
  strengths: string[]
  improvements: string[]
  redFlags: string[]
  criterionScores: CriterionScoreData[]
  feedback: string
  tailRationale: string | null
  tailDecision: string
}

/**
 * 스텝 복구 데이터
 */
export interface StepRestoreData {
  aiQuestionId: string
  type: string
  question: string
  criteria: string[]
  skills: string[]
  rationale?: string | null
  estimatedAnswerTimeSec?: number | null
  parentQuestionId?: string | null // 꼬리질문인 경우 (존재 여부로 구분)
  answer?: string | null
  answerDurationSec?: number | null
  evaluation?: EvaluationData | null
}

/**
 * AI 서버의 /restore 엔드포인트 요청 본문 타입
 */
export interface RestoreRequest {
  steps: StepRestoreData[]
}

// --- 감정 분석 관련 타입 ---

/**
 * AI 서버의 프레임별 감정 점수 객체 타입
 */
export interface EmotionGroupScore {
  frame: number // 프레임 번호
  time: number // 해당 프레임의 시간(초)
  happy: number // happy 감정 확률 (0.0~1.0)
  sad: number // sad 감정 확률 (0.0~1.0)
  neutral: number // neutral 감정 확률 (0.0~1.0)
  angry: number // angry 감정 확률 (0.0~1.0)
  fear: number // fear 감정 확률 (0.0~1.0)
  surprise: number // surprise 감정 확률 (0.0~1.0)
}

/**
 * AI 서버의 /emotion-analyzing 엔드포인트 응답 객체 타입
 */
export interface EmotionAnalysisResult {
  file_name: string // 분석된 영상 파일명
  results: EmotionGroupScore[] // 프레임별 감정 분석 결과
}
