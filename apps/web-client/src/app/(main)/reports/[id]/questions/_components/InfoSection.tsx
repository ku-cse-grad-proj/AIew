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
    <section className={`w-full h-full p-16 flex flex-col gap-8 ${className}`}>
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
          term="evaluatoin criteria"
          description={
            info.rationale +
            '과거 프로젝트에서 직면했던 문제 중 하나를 구체적으로 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 방법을 사용했는지, 그리고 팀원들과의 협력 과정에서 어떤 역할을 했는지 자세히 이야기해 주세요.'
          }
          tags={info.criteria}
        />
        <DefinitionItem
          term="answer"
          description={
            info.answer +
            '과거 프로젝트에서 직면했던 문제 중 하나를 구체적으로 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 방법을 사용했는지, 그리고 팀원들과의 협력 과정에서 어떤 역할을 했는지 자세히 이야기해 주세요.' +
            '과거 프로젝트에서 직면했던 문제 중 하나를 구체적으로 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 방법을 사용했는지, 그리고 팀원들과의 협력 과정에서 어떤 역할을 했는지 자세히 이야기해 주세요.' +
            '과거 프로젝트에서 직면했던 문제 중 하나를 구체적으로 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 방법을 사용했는지, 그리고 팀원들과의 협력 과정에서 어떤 역할을 했는지 자세히 이야기해 주세요.'
          }
        />
      </dl>
    </section>
  )
}
