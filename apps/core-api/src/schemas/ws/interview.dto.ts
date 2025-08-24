import SchemaId from '@/utils/schemaId'

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
 * Type: 'client:ready'
 * 클라이언트가 면접을 시작할 준비가 되었음을 알리는 메시지
 */
export interface ClientReadyPayload {
  sessionId: string // 어떤 면접 세션에 대한 준비인지 확인
}
export type ClientReadyMessage = WebSocketMessage<ClientReadyPayload>

// --- JSON Schema definitions for documentation ---

export const wsClientReadySchema = {
  $id: SchemaId.WsClientReady,
  type: 'object',
  properties: {
    type: { type: 'string', const: 'client:ready' },
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
