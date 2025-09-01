export default function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-neutral-card p-24 rounded-[20px] shadow-box ${className}`}
    >
      {children}
    </div>
  )
}
