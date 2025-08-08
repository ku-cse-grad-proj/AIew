import Form from './Form'

export default async function CreateInterviewPage() {
  return (
    <div className="w-full h-full flex items-center justify-center flex-col">
      <h1 className="text-2xl font-bold">면접 생성 페이지</h1>
      <Form />
    </div>
  )
}
