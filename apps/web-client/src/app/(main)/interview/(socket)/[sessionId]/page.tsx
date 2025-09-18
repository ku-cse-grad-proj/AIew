import AnswerControl from './_comonents/AnswerControl'
import IntervieweePannel from './_comonents/IntervieweePannel'
import InterviewerPannel from './_comonents/InterviewerPannel/InterviewerPannel'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return (
    <article className="w-full h-full grid grid-cols-[2fr_1fr] grid-rows-[7fr_1fr] gap-24">
      <InterviewerPannel sessionId={sessionId} className="min-w-0 min-h-0" />
      <IntervieweePannel className="min-w-0 min-h-0 col-start-2 row-start-1 row-end-3" />
      <AnswerControl />
    </article>
  )
}
