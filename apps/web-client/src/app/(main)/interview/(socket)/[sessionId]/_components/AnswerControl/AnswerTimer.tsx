'use client'

export default function AnswerTimer() {
  return (
    <div className="inline-flex items-center gap-8">
      {/* record 빨간 점 */}
      <div className="w-10 h-10 rounded-full bg-error animate-pulse" />
      <span className="text-neutral-subtext font-medium">05 : 24</span>
    </div>
  )
}
