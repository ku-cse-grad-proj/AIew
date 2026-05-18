'use client'
import { useRouter } from 'next/navigation'
import { env } from 'next-runtime-env'
import { useCallback, useEffect, type ReactNode } from 'react'

import { InterviewContext, InterviewProvider } from './interviewContext'

/**
 * server `page.tsx` 에서 받은 sessionId 를 client 측에서 머신에 주입.
 *
 * - url: NEXT_PUBLIC_SOCKET_URL (runtime env)
 * - revalidate: server action 으로 props 주입
 * - redirecting 진입 감지 시 /reports/[sessionId] 로 navigate
 */
export function InterviewProviderClient({
  sessionId,
  revalidate,
  children,
}: {
  sessionId: string
  revalidate: (sessionId: string) => Promise<void> | void
  children: ReactNode
}) {
  const url = env('NEXT_PUBLIC_SOCKET_URL') ?? ''
  const revalidateBridge = useCallback(
    (id: string) => {
      try {
        const result = revalidate(id)
        if (result && typeof (result as Promise<void>).catch === 'function') {
          ;(result as Promise<void>).catch(() => {})
        }
      } catch {
        // ignore — revalidate 실패해도 머신 흐름은 진행
      }
    },
    [revalidate],
  )

  return (
    <InterviewProvider
      sessionId={sessionId}
      url={url}
      revalidate={revalidateBridge}
    >
      <RedirectOnReportDone sessionId={sessionId} />
      {children}
    </InterviewProvider>
  )
}

/**
 * 머신이 `interviewFinished.redirecting` (final) 상태에 도달하면 navigate.
 * (옛 `useInterviewFinish` 의 router.replace 흐름 대체)
 */
function RedirectOnReportDone({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const redirecting = InterviewContext.useSelector((state) =>
    state.matches({ interviewFinished: 'redirecting' }),
  )

  useEffect(() => {
    if (redirecting) {
      router.replace(`/reports/${sessionId}`)
    }
  }, [redirecting, router, sessionId])

  return null
}
