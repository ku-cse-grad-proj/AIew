'use client'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'

export default function InterviewerPannel() {
  const currentQuestion = useInterviewStore((state) => state.current)
  return <div>{currentQuestion?.text}</div>
}
