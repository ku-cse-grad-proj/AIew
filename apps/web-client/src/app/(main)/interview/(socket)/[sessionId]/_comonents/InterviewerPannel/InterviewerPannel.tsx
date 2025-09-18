'use client'

import { useEffect } from 'react'

import Interviewer from './Interviewer'
import InterviewerSubtitle from './InterviewerSubtitle'
import InterviewHeader from './InterviewHeader'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function InterviewerPannel({
  sessionId,
  className,
}: {
  sessionId: string
  className?: string
}) {
  const currentQuestion = useInterviewStore((state) => state.current)

  useEffect(() => {
    useSttStore.getState().connect(sessionId)

    return () => {
      useSttStore.getState().disconnect()
    }
  }, [currentQuestion])
  return (
    <section
      className={`w-full h-full flex flex-col p-24 bg-neutral-card rounded-[20px] shadow-box ${className}`}
    >
      <InterviewHeader title={'배달의 민족 intervie'} />
      <div className="w-full min-h-0 flex-1 flex flex-col gap-16">
        <Interviewer />
        <InterviewerSubtitle className="min-h-0 flex-1">
          {currentQuestion?.text}
        </InterviewerSubtitle>
      </div>
    </section>
  )
}
