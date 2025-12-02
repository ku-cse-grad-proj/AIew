// 서버에서 오는 이벤트
export type ServerEvent =
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'server:questions-ready'
  | 'server:question-audio-ready'
  | 'server:next-question'
  | 'server:interview-finished'
  | 'server:evaluation-finished'
  | 'server:error'

// 클라이언트에서 보내는 이벤트
export type ClientEvent =
  | 'client:join-room'
  | 'client:submit-answer'
  | 'client:submit-elapsedSec'
  | 'client:ready'
  | 'client:upload-chunk'
  | 'client:upload-finish'

export interface IInterviewSocket {
  connect(url: string, sessionId: string): void
  disconnect(): void

  on(event: ServerEvent, callback: (data?: unknown) => void): void
  emit(event: ClientEvent, payload: unknown): void
}
