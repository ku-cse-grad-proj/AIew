import AnswerControl from './_comonents/AnswerControl'
import IntervieweePannel from './_comonents/IntervieweePannel'
import InterviewerPannel from './_comonents/InterviewerPannel'

export default function InterviewPage() {
  return (
    <div className="w-full h-full grid grid-cols-[5fr_2fr] grid-rows-[5fr_1fr] gap-24">
      <InterviewerPannel />
      <IntervieweePannel />
      <AnswerControl />
      <div className="bg-green-500">interview control</div>
    </div>
  )
}
