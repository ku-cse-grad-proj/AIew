import type { QuestionTypeLabel } from '@/app/_types'

export type QuestionBundle = { main: string; followUps: string[] }

export type CurrentQuestion = {
  stepId: string
  text?: string
  audioBase64?: string
  isFollowUp?: boolean
  order: number
  type: QuestionTypeLabel
  criteria: string[]
  rationale: string
  sttToken: string
}

export type ServerError = { code: string; message: string }

export type InterviewContext = {
  sessionId: string
  url: string
  elapsedSec: number
  questions: QuestionBundle[]
  currentQuestion: CurrentQuestion
  answer: {
    startAt: number
    endAt: number
    sentences: string
    isRedo: boolean
  }
  error: ServerError | null
  redirectAfterMs: number
  /** evaluation-finished 가 interview-finished 보다 먼저 도착 시 보관 */
  preReportReady: boolean
  /**
   * STT DataChannel open 완료 여부.
   * - 새 step 진입 시 false 로 초기화 (assignQuestionReady).
   * - step.preparing.stt.connecting 에서 STT_READY 수신 시 true (markSttReady).
   * - step level on.START_ANSWER guard isSttReady 가 의존 — preparing 도중에도
   *   sttReady=true 면 audio 재생 종료를 기다리지 않고 answering 진입 가능.
   */
  sttReady: boolean
  /** Next.js cache invalidation 콜백 — input 으로 받아 context 에 보관 */
  revalidate: (sessionId: string) => void
}

export type InterviewInput = {
  sessionId: string
  url: string
  revalidate: (sessionId: string) => void
}

export type InterviewEvent =
  | { type: 'ACCESS_INTERVIEW' }
  | {
      type: 'CONNECT'
      payload: { elapsedSec: number; questions: QuestionBundle[] }
    }
  | {
      type: 'QUESTION_READY'
      payload: { current: CurrentQuestion; questions: QuestionBundle[] }
    }
  | { type: 'AUDIO_PLAYED' }
  | { type: 'STT_READY' }
  | { type: 'START_ANSWER' }
  | { type: 'TRANSCRIBE' }
  | { type: 'STT_FINISH'; sentences: string }
  | { type: 'STT_ERROR'; message: string }
  | { type: 'FINISH_ANSWER' }
  | { type: 'REDO_ANSWER' }
  | { type: 'SUBMIT_FINISH' }
  | { type: 'FINISH_INTERVIEW' }
  | { type: 'REPORT_READY' }
  | { type: 'TICK_ELAPSED' }
  | { type: 'SERVER_ERROR'; payload: ServerError }
