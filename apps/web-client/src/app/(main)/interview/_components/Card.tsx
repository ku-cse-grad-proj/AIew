export default function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-bright p-24 rounded-[20px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.07)] ${className}`}
    >
      {children}
    </div>
  )
}
