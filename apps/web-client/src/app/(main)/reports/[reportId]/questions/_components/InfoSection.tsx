'use client'

import { useSearchParams } from 'next/navigation'

import { QuestionReview } from '../_types'

import DefinitionItem from './DefinitionItem'

export default function InfoSection({
  className,
  questionReview,
}: {
  className?: string
  questionReview: QuestionReview
}) {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const questionInfos = questionReview.questionInfos
  const info =
    questionInfos.find((question) => question.id === id) ?? questionInfos[0]
  return (
    <section
      className={`w-full h-full p-16 flex flex-col gap-8 overflow-auto ${className}`}
    >
      <header className="flex justify-between items-center">
        <h1 className="text-[24px] font-medium leading-[36px]">
          {questionReview.title} answer review
        </h1>
        <span className="p-8 bg-neutral-background rounded-[8px] font-medium">
          score: {info.score}
        </span>
      </header>
      <dl className="w-full flex-1 min-h-0 flex flex-col gap-8">
        <DefinitionItem
          term="question"
          description={info.question}
          tags={[info.type]}
        />
        <DefinitionItem
          term="evaluation criteria"
          description={info.rationale}
          tags={info.criteria}
        />
        <DefinitionItem term="answer" description={info.answer} />
      </dl>
    </section>
  )
}
