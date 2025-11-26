import { createInterview, updateInterview } from '../../_lib/action'
import { getInterview } from '../../_lib/api'
import Form from '../component/Form'

export default async function CreateInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const interview = sessionId && sessionId[0] && (await getInterview(sessionId))

  //만약 interview가 존재하면 update, 없으면 create
  const handleSubmit = async (formData: FormData) => {
    'use server'
    if (interview) {
      await updateInterview(formData, interview)
    } else {
      await createInterview(formData)
    }
  }

  return <Form interview={interview} onSubmitAction={handleSubmit} />
}
