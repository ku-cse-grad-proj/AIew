function QuestionTag({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`h-24 px-24 py-10 inline-flex items-center justify-center rounded-full text-[12px] text-neutral-card ${className}`}
    >
      {children}
    </span>
  )
}
export function MainTag() {
  return <QuestionTag className="bg-success">main</QuestionTag>
}

export function FollowUpTag() {
  return <QuestionTag className="bg-warning">follow up</QuestionTag>
}
