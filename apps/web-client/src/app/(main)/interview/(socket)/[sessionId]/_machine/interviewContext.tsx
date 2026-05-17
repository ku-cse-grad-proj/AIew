'use client'
import { createActorContext } from '@xstate/react'
import type { ReactNode } from 'react'

import { interviewMachine } from './interviewMachine'

/**
 * Phase 2.2 — `createActorContext` 로 머신을 React context 화.
 * 컴포넌트는 `InterviewContext.useSelector` / `useActorRef` 로 머신을 구독한다.
 *
 * Provider 는 `InterviewProvider` 로 wrapping 해 input(sessionId, url, revalidate)
 * 을 명시적으로 주입.
 */
export const InterviewContext = createActorContext(interviewMachine)

export function InterviewProvider({
  sessionId,
  url,
  revalidate,
  children,
}: {
  sessionId: string
  url: string
  revalidate: (sessionId: string) => void
  children: ReactNode
}) {
  return (
    <InterviewContext.Provider
      options={{ input: { sessionId, url, revalidate } }}
    >
      {children}
    </InterviewContext.Provider>
  )
}
