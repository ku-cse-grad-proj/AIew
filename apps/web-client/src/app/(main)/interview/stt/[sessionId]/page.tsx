import Stt from './_components/Stt'

export default async function SttPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  return <Stt sessionId={sessionId} />
}
