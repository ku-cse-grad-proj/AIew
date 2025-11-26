import DeckLayout from '../../_components/DeckLayout'
import { getQuestions } from '../../_lib/api'
import { EmotionGraphDataWithId } from '../../_types'

import EmotionSection from './_components/EmotionSection'
import FeedbackSection from './_components/FeedbackSection'
import InfoSection from './_components/InfoSection'
import { QuestionFeedback, QuestionInfo } from './_types'

import { QUESTION_TYPES, QuestionType } from '@/app/_types'

// main이든 tail이든 필요한 필드만 뽑아 QuestionInfo로 변환
const toInfo = (s: {
  id: string
  question: string
  type: string
  rationale: string
  criteria: string[]
  answer: string
  score: number | null
}): QuestionInfo => ({
  id: s.id,
  question: s.question,
  type: QUESTION_TYPES[s.type as QuestionType],
  rationale: s.rationale,
  criteria: s.criteria,
  answer: s.answer,
  score: s.score ?? 1,
})

const toFeedback = (q: {
  id: string
  redFlags: string[]
  improvements: string[]
  feedback: string | null
}): QuestionFeedback => ({
  id: q.id,
  redFlags: q.redFlags,
  improvements: q.improvements,
  feedback: q.feedback ?? '',
})

export default async function QuestionsReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const data = await getQuestions(reportId)
  const title = data.title
  const questions = data.questions

  //Info에 사용될 데이터 추출
  const questionInfos: QuestionInfo[] = questions.flatMap((main) => [
    toInfo(main),
    ...main.tailSteps.map(toInfo),
  ])

  //Feedback에 사용될 데이터 추출
  const feedbacks: QuestionFeedback[] = questions.flatMap((main) => [
    toFeedback(main),
    ...main.tailSteps.map(toFeedback),
  ])

  const emotionGraphDatas: EmotionGraphDataWithId[] = questions.flatMap(
    (main) => [
      { id: main.id, graphData: main.emotionGraphData },
      ...main.tailSteps.map((tail) => ({
        id: tail.id,
        graphData: tail.emotionGraphData,
      })),
    ],
  )

  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <div className={`w-full h-full flex flex-col gap-24`}>
      <InfoSection
        questionReview={{ title, questionInfos }}
        className={`flex-7 min-h-0 ${cardStyle}`}
      />
      <DeckLayout className={`flex-8 min-h-0`}>
        {/* top card */}
        <FeedbackSection feedbacks={feedbacks} />
        {/* bottom card */}
        <EmotionSection dataWithId={emotionGraphDatas} />
      </DeckLayout>
    </div>
  )
}
