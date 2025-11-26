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

  const cardStyle = 'bg-neutral-card rounded-[20px] shadow-box'

  return <ListSection className={`${cardStyle}`} questionList={questionList} />
}
