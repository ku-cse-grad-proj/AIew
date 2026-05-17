import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * OpenAI Realtime STT 용 RTCPeerConnection / MediaStream / DataChannel lifecycle.
 * TDD Red 단계의 stub.
 */
export const sttActor = fromCallback<InterviewEvent, { sttToken: string }>(
  () => {
    // TODO(AIEW-237): RTCPeerConnection · getUserMedia · DataChannel 연결
    return () => {
      // cleanup: pc.close, mediaStream tracks stop
    }
  },
)
