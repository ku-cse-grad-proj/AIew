export default function Interviewer({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full aspect-[16/9] bg-gray-500 rounded-[20px] ${className}`}
    >
      {children}
    </div>
  )
}
