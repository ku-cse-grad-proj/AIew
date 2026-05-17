import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * Socket.IO 클라이언트 lifecycle 을 관리하는 callback actor.
 * 본 파일은 Phase 2.1 TDD Red 단계의 stub.
 * Phase 2.1 Green 단계(메인 구현)에서 본 구현 채워질 예정.
 */
export const socketActor = fromCallback<
  InterviewEvent,
  { sessionId: string; url: string }
>(() => {
  // TODO(AIEW-237): socket.io-client 연결, 서버 이벤트 → 머신 이벤트 변환
  return () => {
    // cleanup
  }
})
