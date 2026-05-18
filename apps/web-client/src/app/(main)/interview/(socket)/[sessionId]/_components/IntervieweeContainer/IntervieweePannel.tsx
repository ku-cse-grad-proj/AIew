'use client'

import { InterviewContext } from '../../_machine/interviewContext'

import CurrentQuestion from './CurrentQuestion'
import ExitLink from './ExitLink'
import HintArea from './HintArea'
import Interviewee from './Interviewee'
import IntervieweeSection from './IntervieweeSection'
import IntervieweeTranscript from './IntervieweeTranscript'

type Props = React.HTMLProps<HTMLDivElement> & {
  onClick: () => void
}

export default function IntervieweePannel({ onClick, ...props }: Props) {
  const sentences = InterviewContext.useSelector(
    (state) => state.context.answer.sentences,
  )
  return (
    <IntervieweeSection {...props}>
      <CurrentQuestion onClick={onClick} />
      <div className="flex-1 min-h-0 flex flex-col gap-24 pt-12">
        <Interviewee />
        <IntervieweeTranscript className="flex-5 min-h-0">
          {sentences}
        </IntervieweeTranscript>

        <HintArea className="flex-5 min-h-0">
          <ExitLink />
        </HintArea>
      </div>
    </IntervieweeSection>
  )
}
