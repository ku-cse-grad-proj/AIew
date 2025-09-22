'use client'
import Image from 'next/image'

import { FollowUpTag, MainTag } from './QuestionTags'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
export default function CurrentQuestion({ onClick }: { onClick: () => void }) {
  const current = useInterviewStore((state) => state.current)

  return (
    <h3>
      <button
        type="button"
        className="w-full flex items-center justify-between p-8"
        onClick={onClick}
      >
        <span className="inline-flex items-center gap-8">
          <strong className="text-[20px] font-medium">
            Question {current ? current.order : 1}
          </strong>
          {current?.isFollowUp ? <FollowUpTag /> : <MainTag />}
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
