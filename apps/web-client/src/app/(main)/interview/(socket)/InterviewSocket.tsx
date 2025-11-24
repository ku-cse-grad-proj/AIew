'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'

import { useInterviewActions } from '@/app/hooks/InterviewActionsContext'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'

export default function InterviewSocket() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId
  const { revalidateInterviewAndReports } = useInterviewActions()

  const connect = useInterviewStore((state) => state.connect)
  const disconnect = useInterviewStore((state) => state.disconnect)
  useEffect(() => {
    if (!sessionId) {
      throw new Error('sessionId 가 존재하지 않습니다.')
    }

    connect(sessionId, revalidateInterviewAndReports)
    return () => disconnect()
  }, [sessionId, connect, disconnect])
  return <></>
}
