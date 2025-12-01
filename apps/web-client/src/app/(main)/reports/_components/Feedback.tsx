export default function Feedback({ feedback }: { feedback?: string }) {
  return (
    <section className="w-full h-full flex flex-col px-16 py-10 gap-16">
      <h2 className="font-medium">feedback</h2>
      <p className="flex-1 min-h-0 overflow-auto leading-[32px]">{feedback}</p>
    </section>
  )
}
