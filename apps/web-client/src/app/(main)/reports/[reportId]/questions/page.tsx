import DeckLayout from '../../_components/DeckLayout'
import { getQuestions } from '../../_lib/api'

import EmotionSection from './_components/EmotionSection'
import FeedbackSection from './_components/FeedbackSection'
import InfoSection from './_components/InfoSection'
import { QuestionFeedback, QuestionInfo } from './_types'

import { EmotionGraphData } from '@/app/(main)/_components/graph/EmotionGraph'
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
        <EmotionSection emotionGraphData={mockEmotionGraphData} />
      </DeckLayout>
    </div>
  )
}

export const mockEmotionGraphData: EmotionGraphData = {
  labels: Array.from({ length: 20 }, (_, i) => `${i}s`), // 0~19초

  angry: [
    0.1, 0.08, 0.05, 0.03, 0.02, 0.01, 0.02, 0.03, 0.05, 0.04, 0.03, 0.02, 0.02,
    0.01, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0,
  ],
  fear: [
    0.05, 0.06, 0.07, 0.08, 0.1, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.03,
    0.02, 0.02, 0.01, 0.01, 0.0, 0.0, 0.0,
  ],
  happy: [
    0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.7, 0.68, 0.65,
    0.6, 0.55, 0.5, 0.45, 0.4, 0.35,
  ],
  neutral: [
    0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.28, 0.25, 0.22, 0.2, 0.2, 0.22,
    0.25, 0.28, 0.3, 0.32, 0.35, 0.38, 0.4,
  ],
  sad: [
    0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.13,
    0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03,
  ],
  surprise: [
    0.02, 0.02, 0.03, 0.04, 0.05, 0.08, 0.1, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04,
    0.03, 0.02, 0.02, 0.01, 0.01, 0.0, 0.0,
  ],
}
