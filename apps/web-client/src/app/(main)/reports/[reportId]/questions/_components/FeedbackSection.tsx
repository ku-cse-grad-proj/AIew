'use client'

import { useSearchParams } from 'next/navigation'

import { QuestionFeedback } from '../_types'

import DefinitionItem from './DefinitionItem'

import RedFlagIcon from '@/../public/icons/error.svg'

export default function FeedbackSection({
  feedbacks,
}: {
  feedbacks: QuestionFeedback[]
}) {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const feedback: QuestionFeedback =
    feedbacks.find((feedback) => feedback.id === id) ?? feedbacks[0]
  return (
    <section className="w-full h-full flex flex-col px-16 py-10 overflow-auto">
      <h2 className="font-medium">feedback</h2>

      {/* redFlags가 존재할 때에만 redFlag 표시 */}
      {feedback.redFlags.length > 0 && (
        <ul className="pt-8">
          {feedback.redFlags.map((redFlag, i) => (
            <li key={i} className="pt-4">
              <RedFlag redFlag={redFlag} />
            </li>
          ))}
        </ul>
      )}

      <dl className="pt-8 flex-1 min-h-0 flex flex-col gap-8">
        <DefinitionItem
          term="improvements"
          description={feedback.improvements}
        />
        <DefinitionItem term="feedback" description={feedback.feedback} />
      </dl>
    </section>
  )
}

function RedFlag({ redFlag }: { redFlag: string }) {
  return (
    <span className="inline-flex items-center gap-4 py-8 px-16 text-[14px] bg-neutral-background rounded-[8px]">
      <RedFlagIcon width={20} height={20} />
      {redFlag}
    </span>
  )
}
