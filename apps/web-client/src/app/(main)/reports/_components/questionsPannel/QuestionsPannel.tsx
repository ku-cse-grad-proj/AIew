import { QuestionList } from '../../[reportId]/questions/_types'
import { getQuestions } from '../../_lib/api'

import ListSection from './ListSection'

export default async function QuestionsPanel({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const data = await getQuestions(reportId)

  const questionList: QuestionList[] = data.questions.map((main) => ({
    id: main.id,
    question: main.question,
    followUps: main.tailSteps.map((step) => ({
      id: step.id,
      question: step.question,
    })),
  }))

  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'

  return (
    <ListSection
      className={`flex-3 min-h-0 shrink-0 ${cardStyle}`}
      questionList={questionList}
    />
  )
}
