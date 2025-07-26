import SchemaId from '../../utils/schemaId'

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
  questions: {
    technical: string[]
    personality: string[]
    tailored: string[]
  }
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
        questions: {
          type: 'object',
          properties: {
            technical: {
              type: 'array',
              items: {
                type: 'string',
                const: [
                  '저희 서비스에서 사용 중인 Fastify의 장단점에 대해 설명해주세요.',
                  'HTTP와 WebSocket의 차이점을 설명하고, 어떤 상황에서 각각을 사용해야 할까요?',
                ],
              },
            },
            personality: {
              type: 'array',
              items: {
                type: 'string',
                const: [
                  '가장 어려웠던 협업 경험은 무엇이며, 어떻게 해결했나요?',
                  '스트레스를 관리하는 자신만의 방법이 있나요?',
                ],
              },
            },
            tailored: {
              type: 'array',
              items: {
                type: 'string',
                const: [
                  '제출하신 포트폴리오의 인증 시스템에서 Refresh Token의 역할을 더 자세히 설명해주세요.',
                  "저희 회사의 인재상인 '끊임없는 학습'을 실천했던 경험이 있다면 말씀해주세요.",
                ],
              },
            },
          },
          required: ['technical', 'personality', 'tailored'],
        },
      },
      required: ['questions'],
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
