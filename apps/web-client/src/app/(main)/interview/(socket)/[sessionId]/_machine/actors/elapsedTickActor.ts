'use client'
import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * 1초 마다 TICK_ELAPSED 발신하는 callback actor.
 * 머신은 이 이벤트로 elapsedSec 을 증가시키지 않고, 별도 view-only 타이머가
 * 시작 시점을 기준으로 계산한다. 이 actor 는 서버 동기화용으로
 * socketActor 에 client:submit-elapsedSec 을 위임하기 위한 단순 ticker.
 */
export const elapsedTickActor = fromCallback<InterviewEvent>(({ sendBack }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'TICK_ELAPSED' })
  }, 1000)

  return () => {
    clearInterval(interval)
  }
})
