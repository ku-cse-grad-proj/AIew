export default function Loading() {
  const baseCardStyle = 'bg-neutral-card shadow-box rounded-[20px]'
  return (
    <div className="w-full h-full flex flex-col gap-24 animate-pulse">
      <div className={`flex-1 ${baseCardStyle}`} />
      <div className={`flex-3 ${baseCardStyle}`} />
    </div>
  )
}
