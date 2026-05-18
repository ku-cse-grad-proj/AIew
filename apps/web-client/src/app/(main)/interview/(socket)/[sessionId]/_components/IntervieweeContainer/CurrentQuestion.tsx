'use client'
import Image from 'next/image'

import { InterviewContext } from '../../_machine/interviewContext'

import { FollowUpTag, MainTag } from './QuestionTags'

export default function CurrentQuestion({ onClick }: { onClick: () => void }) {
  const order = InterviewContext.useSelector(
    (state) => state.context.currentQuestion.order,
  )
  const isFollowUp = InterviewContext.useSelector(
    (state) => state.context.currentQuestion.isFollowUp,
  )

  return (
    <h3>
      <button
        type="button"
        className="w-full flex items-center justify-between p-8"
        onClick={onClick}
      >
        <span className="inline-flex items-center gap-8">
          <strong className="text-[20px] font-medium">
            Question {order > 0 ? order : 1}
          </strong>
          {isFollowUp ? <FollowUpTag /> : <MainTag />}
        </span>
        <Image
          src={'/icons/toggle_false.svg'}
          alt={'toggle icon'}
          width={20}
          height={20}
        />
      </button>
    </h3>
  )
}
