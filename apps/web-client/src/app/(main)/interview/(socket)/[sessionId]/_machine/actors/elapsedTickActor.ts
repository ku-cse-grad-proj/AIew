import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * 1초 마다 TICK_ELAPSED 발신하는 callback actor.
 * TDD Red 단계의 stub.
 */
export const elapsedTickActor = fromCallback<InterviewEvent>(() => {
  // TODO(AIEW-237): setInterval 1000ms → sendBack({ type: 'TICK_ELAPSED' })
  return () => {
    // cleanup: clearInterval
  }
})
