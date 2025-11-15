export default function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-neutral-card p-24 rounded-[20px] min-w-400 min-h-720 shadow-box ${className}`}
    >
      {children}
    </div>
  )
}
