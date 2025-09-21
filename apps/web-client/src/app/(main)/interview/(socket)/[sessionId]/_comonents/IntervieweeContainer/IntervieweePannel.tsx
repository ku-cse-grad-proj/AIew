'use client'

import HintSection from './HintSection'
import Interviewee from './Interviewee'
import IntervieweeSection from './IntervieweeSection'
import IntervieweeTranscript from './IntervieweeTranscript'
import LeaveButton from './LeaveButton'
import Questions from './Questions'

import { useSttStore } from '@/app/lib/socket/sttStore'

export default function IntervieweePannel() {
  const sentences = useSttStore((state) => state.sentences)
  return (
    <IntervieweeSection>
      <Questions />
      <div className="flex-1 min-h-0 flex flex-col gap-24 pt-12 pb-24">
        <Interviewee />
        <IntervieweeTranscript className="flex-5 min-h-0">
          {sentences}
        </IntervieweeTranscript>
        <HintSection className="flex-3 min-h-0" />
      </div>
      <LeaveButton />
    </IntervieweeSection>
  )
}
