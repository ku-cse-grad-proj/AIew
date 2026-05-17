'use client'

import { useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import LoadingCircle from './LoadingCircle'

import Card from '@/app/(main)/interview/_components/Card'
import FooterButtons from '@/app/(main)/interview/_components/FooterButtons'
import { useInterviewActions } from '@/app/hooks/InterviewActionsContext'

/**
 * waiting 화면 — 서버가 질문 생성 (PENDING) 을 마칠 때까지 polling.
 *
 * 옛 구현은 layout 의 `<InterviewSocket />` 이 즉시 socket 을 연결해 두고
 * `server:questions-ready` 의 questions 길이로 준비 여부를 표시했다.
 * Phase 2.3 에서 socket 연결은 면접 화면(`[sessionId]/page.tsx`)의 머신이
 * 보유하도록 좁히고, waiting 은 단순히 interview.status 를 polling 한다.
 */
const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 20000

export default function LoadingCard() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId
  const { getInterview } = useInterviewActions()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    const interval = setInterval(async () => {
      try {
        const updated = await getInterview(sessionId, false)
        if (cancelled) return
        if (updated.status !== 'PENDING') {
          setIsReady(true)
          clearInterval(interval)
          clearTimeout(timeoutId)
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to poll interview status:', err)
      }
    }, POLL_INTERVAL_MS)

    const timeoutId = setTimeout(() => {
      cancelled = true
      clearInterval(interval)
      console.warn(
        `Interview ${sessionId} waiting polling timed out after ${POLL_TIMEOUT_MS}ms`,
      )
    }, POLL_TIMEOUT_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [sessionId, getInterview])

  return (
    <Card className="w-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-48">
        <LoadingCircle />
        <span
          className={`text-black ${!isReady && `shimmer-text`}`}
          data-content={
            isReady ? 'All set. Ready when you are.' : 'preparing interview...'
          }
        >
          {isReady ? 'All set. Ready when you are.' : 'preparing interview...'}
        </span>
      </div>
      <Suspense>
        <FooterButtons mode="waiting" isQuestionsReady={isReady} />
      </Suspense>
    </Card>
  )
}
