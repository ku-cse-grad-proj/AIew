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
