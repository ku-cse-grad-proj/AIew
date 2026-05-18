'use client'

import { InterviewContext } from '../../_machine/interviewContext'

import Interviewer from './Interviewer'
import InterviewerSubtitle from './InterviewerSubtitle'
import InterviewHeader from './InterviewHeader'

/**
 * Phase 2.2 — useSttStore.connect / new Audio(...) 호출 제거.
 *
 * 머신이 step 진입 시 sttActor / audioActor 를 자동 invoke 하므로
 * 본 컴포넌트는 currentQuestion 텍스트만 표시.
 */
export default function InterviewerPannel({
  className,
  title,
}: {
  sessionId: string
  className?: string
  title: string
}) {
  const text = InterviewContext.useSelector(
    (state) => state.context.currentQuestion.text,
  )

  return (
    <section
      className={`w-full h-full flex flex-col p-24 bg-neutral-card rounded-[20px] shadow-box ${className}`}
    >
      <InterviewHeader title={title} />
      <div className="w-full min-h-0 flex-1 flex flex-col gap-16">
        <Interviewer />
        <InterviewerSubtitle className="min-h-0 flex-1">
          {text}
        </InterviewerSubtitle>
      </div>
    </section>
  )
}
