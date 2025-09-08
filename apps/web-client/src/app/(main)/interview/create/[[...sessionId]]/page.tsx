import Form from '../Form'

import { privateFetch } from '@/app/lib/fetch'

export default async function CreateInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const fetchInterview = async () => {
    const response = await privateFetch(
      process.env.NEXT_PUBLIC_API_BASE + '/interviews/' + sessionId,
    )
    return await response.json()
  }

  const interview = sessionId && sessionId[0] && (await fetchInterview())

  return (
    <div className="w-full h-full p-24">
      {sessionId && sessionId[0] ? <Form interview={interview} /> : <Form />}
    </div>
  )
}
