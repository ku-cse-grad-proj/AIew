'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useInterviewStore } from '../lib/socket/interviewStore'

export default function useInterviewFinish(sessionId: string) {
  const router = useRouter()
  const { finished, reportReady } = useInterviewStore(
    useShallow((state) => ({
      finished: state.finished,
      reportReady: state.reportReady,
    })),
  )
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  //report 준비가 완료되면 3초 카운팅한 후에 reports/[sessionId]로 넘어가는 로직
  useEffect(() => {
    if (!finished || !reportReady) {
      setRemainingSeconds(null)
      return
    }

    const startSeconds = 3
    setRemainingSeconds(startSeconds)

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev
        return prev > 1 ? prev - 1 : 1
      })
    }, 1000)

    const timer = setTimeout(() => {
      router.replace('/reports/' + sessionId)
    }, startSeconds * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [finished, reportReady, router, sessionId])

  return { finished, reportReady, remainingSeconds }
}
