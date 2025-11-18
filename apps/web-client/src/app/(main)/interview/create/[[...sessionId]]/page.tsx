import { getInterview } from '../../_lib/api'
import Form from '../Form'

export default async function CreateInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const interview = sessionId && sessionId[0] && (await getInterview(sessionId))

  return (
    <div className="w-full h-full p-24">
      {sessionId && sessionId[0] ? <Form interview={interview} /> : <Form />}
    </div>
  )
}
