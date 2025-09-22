'use client'

import Image from 'next/image'

import IntervieweeSection from './IntervieweeSection'
import QuestionList from './QuestionList'

export default function QuestionPannel({
  className,
  onClick,
}: {
  className?: string
  onClick: () => void
}) {
  return (
    <IntervieweeSection className={className}>
      {/* header */}
      <button
        type="button"
        onClick={onClick}
        className="w-full h-48 flex items-center gap-16"
      >
        <Image
          src={'/icons/toggle_true.svg'}
          alt={'toggle icon'}
          width={20}
          height={20}
        />
        <span className="text-[20px]">back</span>
      </button>
      {/* body */}
      <QuestionList />
    </IntervieweeSection>
  )
}
