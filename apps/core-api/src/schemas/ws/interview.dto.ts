import SchemaId from '@/utils/schema-id'

// --- TypeScript Interfaces for type-safety in code ---

/**
 * 웹소켓을 통해 교환되는 모든 메시지의 기본 구조
 * @template T - payload의 타입
 */
export interface WebSocketMessage<T> {
  type: string
  payload: T
}

// --- 서버 -> 클라이언트 메시지 ---

/**
 * Type: 'server:questions-ready'
 * 질문 생성이 완료되었음을 알리는 메시지
 */
export interface QuestionsReadyPayload {
  steps: {
    id: string
    type: 'TECHNICAL' | 'PERSONALITY' | 'TAILORED'
    question: string
    // 초기 질문에는 답변, 피드백 등이 없으므로 optional
    answer?: string | null
    feedback?: string | null
    score?: number | null
    createdAt: Date
    updatedAt: Date
    interviewSessionId: string
    parentStepId?: string | null
  }[]
}
export type ServerQuestionsReadyMessage =
  WebSocketMessage<QuestionsReadyPayload>

/**
 * Type: 'server:question-audio-ready'
 * 특정 질문에 대한 TTS 음성 파일이 준비되었음을 알리는 메시지
 */
export interface QuestionAudioReadyPayload {
  stepId: string
  audioBase64: string
}
export type ServerQuestionAudioReadyMessage =
  WebSocketMessage<QuestionAudioReadyPayload>

/**
 * Type: 'server:next-question'
 * 다음 질문(메인 또는 꼬리 질문)을 전달하는 메시지
 */
export interface NextQuestionPayload {
  step: QuestionsReadyPayload['steps'][0] // 재사용
  isFollowUp: boolean
  audioBase64: string
}
export type ServerNextQuestionMessage = WebSocketMessage<NextQuestionPayload>

/**
 * Type: 'server:interview-finished'
 * 면접이 종료되었음을 알리는 메시지
 */
export interface InterviewFinishedPayload {
  sessionId: string
}
export type ServerInterviewFinishedMessage =
  WebSocketMessage<InterviewFinishedPayload>

/**
 * Type: 'server:error'
 * 처리 중 에러가 발생했음을 알리는 메시지
 */
export interface ErrorPayload {
  code: string // 예: 'AI_GENERATION_FAILED', 'SESSION_NOT_FOUND'
  message: string
}
export type ServerErrorMessage = WebSocketMessage<ErrorPayload>

// --- 클라이언트 -> 서버 메시지 ---

/**
 * Type: 'client:submit-answer'
 * 사용자의 답변을 서버로 제출하는 메시지
 */
export interface SubmitAnswerPayload {
  stepId: string
  answer: string
  duration: number // 답변 소요 시간 (초)
}
export type ClientSubmitAnswerMessage = WebSocketMessage<SubmitAnswerPayload>

// --- JSON Schema definitions for documentation ---

export const wsClientSubmitAnswerSchema = {
  $id: SchemaId.WsClientSubmitAnswer,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'client:submit-answer' },
    payload: {
      type: 'object',
      properties: {
        stepId: {
          type: 'string',
          description: '현재 답변하고 있는 질문(step)의 ID',
        },
        answer: { type: 'string', description: '사용자의 답변 내용' },
        duration: {
          type: 'integer',
          description: '답변에 소요된 시간 (초 단위)',
        },
      },
      required: ['stepId', 'answer', 'duration'],
    },
  },
  required: ['type', 'payload'],
}

export const wsServerQuestionsReadySchema = {
  $id: SchemaId.WsServerQuestionsReady,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'server:questions-ready' },
    payload: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: {
                type: 'string',
                enum: ['TECHNICAL', 'PERSONALITY', 'TAILORED'],
              },
              question: { type: 'string' },
              answer: { type: ['string', 'null'] },
              feedback: { type: ['string', 'null'] },
              score: { type: ['integer', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              interviewSessionId: { type: 'string' },
              parentStepId: { type: ['string', 'null'] },
            },
            required: [
              'id',
              'type',
              'question',
              'createdAt',
              'updatedAt',
              'interviewSessionId',
            ],
          },
        },
      },
      required: ['steps'],
    },
  },
  required: ['type', 'payload'],
}

export const wsServerQuestionAudioReadySchema = {
  $id: SchemaId.WsServerQuestionAudioReady,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'server:question-audio-ready' },
    payload: {
      type: 'object',
      properties: {
        stepId: {
          type: 'string',
          description: '음성 파일에 해당하는 질문(step)의 ID',
        },
        audioBase64: {
          type: 'string',
          description: 'Base64로 인코딩된 MP3 오디오 데이터',
        },
      },
      required: ['stepId', 'audioBase64'],
    },
  },
  required: ['type', 'payload'],
}

export const wsServerNextQuestionSchema = {
  $id: SchemaId.WsServerNextQuestion,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'server:next-question' },
    payload: {
      type: 'object',
      properties: {
        step: {
          $ref: `${SchemaId.WsServerQuestionsReady}#/properties/payload/properties/steps/items`,
        },
        isFollowUp: {
          type: 'boolean',
          description: '이 질문이 꼬리 질문인지 여부',
        },
        audioBase64: {
          type: 'string',
          description: 'Base64로 인코딩된 다음 질문의 MP3 오디오 데이터',
        },
      },
      required: ['step', 'isFollowUp', 'audioBase64'],
    },
  },
  required: ['type', 'payload'],
}

export const wsServerInterviewFinishedSchema = {
  $id: SchemaId.WsServerInterviewFinished,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'server:interview-finished' },
    payload: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
  },
  required: ['type', 'payload'],
}

export const wsServerErrorSchema = {
  $id: SchemaId.WsServerError,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'server:error' },
    payload: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['type', 'payload'],
}
