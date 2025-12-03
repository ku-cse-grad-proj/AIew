import { getInterview } from '../../_lib/api'

import AnswerControl from './_components/AnswerControl/AnswerControl'
import IntervieweeContainer from './_components/IntervieweeContainer/IntervieweeContainer'
import InterviewerPannel from './_components/InterviewerPannel/InterviewerPannel'
import InterviewFinishModal from './_components/InterviewFinishModal'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const interview: Interview = await getInterview(sessionId)

  // if (interview.status === 'COMPLETED') {
  //   return <ErrorPage reason="완료한 Interview는 진행할 수 없습니다" />
  // }

  return (
    <article className="w-full flex-1 min-h-680 grid grid-cols-[2fr_1fr] grid-rows-[7fr_1fr] gap-24">
      <InterviewerPannel
        title={interview.title}
        sessionId={sessionId}
        className="min-w-0 min-h-0"
      />
      <IntervieweeContainer className="min-w-0 min-h-0 col-start-2 row-start-1 row-end-3" />
      <AnswerControl className="min-w-0 min-h-0" />
      <InterviewFinishModal sessionId={sessionId} status={interview.status} />
    </article>
  )
}
