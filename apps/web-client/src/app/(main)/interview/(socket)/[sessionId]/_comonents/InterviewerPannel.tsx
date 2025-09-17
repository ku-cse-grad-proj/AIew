'use client'

import { useEffect } from 'react'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function InterviewerPannel({
  sessionId,
}: {
  sessionId: string
}) {
  const currentQuestion = useInterviewStore((state) => state.current)

  useEffect(() => {
    useSttStore.getState().connect(sessionId)

    return () => {
      useSttStore.getState().disconnect()
    }
  }, [currentQuestion])
  return <div>{currentQuestion?.text}</div>
}
