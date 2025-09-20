export default function InterviewerSubtitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full bg-neutral-background rounded-[10px] overflow-hidden ${className}`}
    >
      <p className="h-full p-16 overflow-y-auto">{children}</p>
    </div>
  )
}
