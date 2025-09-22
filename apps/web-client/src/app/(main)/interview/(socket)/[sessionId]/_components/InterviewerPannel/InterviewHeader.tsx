import InterviewTimer from './InterviewTimer'

export default function InterviewHeader({ title }: { title: string }) {
  return (
    <header className="w-full flex items-center justify-between px-6 pt-4 pb-8">
      <h2 className="text-2xl font-medium leading-[1.5]">{title}</h2>
      <InterviewTimer />
    </header>
  )
}
