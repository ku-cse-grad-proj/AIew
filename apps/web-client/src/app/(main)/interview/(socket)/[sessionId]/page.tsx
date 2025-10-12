import Link from 'next/link'

import AnswerControl from './_components/AnswerControl/AnswerControl'
import IntervieweeContainer from './_components/IntervieweeContainer/IntervieweeContainer'
import InterviewerPannel from './_components/InterviewerPannel/InterviewerPannel'

import { privateFetch } from '@/app/lib/fetch'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const { CORE_API_URL, API_PREFIX } = process.env
  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/interviews/${sessionId}`,
  )
  if (!response.ok) {
    return (
      <ErrorPage reason="sessionId에 해당하는 Interview를 찾을 수 없습니다." />
    )
  }
  const interview: Interview = await response.json()
  if (interview.status === 'COMPLETED') {
    return <ErrorPage reason="완료한 Interview는 진행할 수 없습니다" />
  }

  return (
    <article className="w-full h-full grid grid-cols-[2fr_1fr] grid-rows-[7fr_1fr] gap-24">
      <InterviewerPannel
        title={interview.title}
        sessionId={sessionId}
        className="min-w-0 min-h-0"
      />
      <IntervieweeContainer className="min-w-0 min-h-0 col-start-2 row-start-1 row-end-3" />
      <AnswerControl className="min-w-0 min-h-0" />
    </article>
  )
}

function ErrorPage({ reason }: { reason: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-24">
      {reason}
      <Link
        href={'/interview'}
        className="px-16 py-10 bg-primary text-neutral-background rounded-[10px]"
      >
        back to Interview
      </Link>
    </div>
  )
}
