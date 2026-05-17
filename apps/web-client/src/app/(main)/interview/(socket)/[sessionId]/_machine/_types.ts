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
