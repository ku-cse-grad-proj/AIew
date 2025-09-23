'use client'

import CurrentQuestion from './CurrentQuestion'
import ExitLink from './ExitLink'
import HintArea from './HintArea'
import HintButton from './HintButton'
import Interviewee from './Interviewee'
import IntervieweeSection from './IntervieweeSection'
import IntervieweeTranscript from './IntervieweeTranscript'

import { useSttStore } from '@/app/lib/socket/sttStore'

type Props = React.HTMLProps<HTMLDivElement> & {
  onClick: () => void
}

export default function IntervieweePannel({ onClick, ...props }: Props) {
  const sentences = useSttStore((state) => state.sentences)
  return (
    <IntervieweeSection {...props}>
      <CurrentQuestion onClick={onClick} />
      <div className="flex-1 min-h-0 flex flex-col gap-24 pt-12">
        <Interviewee />
        <IntervieweeTranscript className="flex-5 min-h-0">
          {sentences}
        </IntervieweeTranscript>

        <HintArea className="flex-3 min-h-0">
          <div className="w-full h-full flex flex-col items-start justify-between">
            <HintButton />
            <ExitLink />
          </div>
        </HintArea>
      </div>
    </IntervieweeSection>
  )
}
