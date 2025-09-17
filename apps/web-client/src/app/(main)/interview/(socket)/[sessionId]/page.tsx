import AnswerControl from './_comonents/AnswerControl'
import IntervieweePannel from './_comonents/IntervieweePannel'
import InterviewerPannel from './_comonents/InterviewerPannel'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return (
    <div className="w-full h-full grid grid-cols-[5fr_2fr] grid-rows-[5fr_1fr] gap-24">
      <InterviewerPannel sessionId={sessionId} />
      <IntervieweePannel />
      <AnswerControl />
      <div className="bg-green-500">interview control</div>
    </div>
  )
}
