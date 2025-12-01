'use client'

import { useEffect, useState } from 'react'

import { useAnswerStore } from '@/app/lib/answerStore'

export default function AnswerTimer() {
  const startAt = useAnswerStore((state) => state.startAt)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startAt) return

    //500ms마다 경과 시간 업데이트
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startAt) / 1000))
    }, 500)

    return () => clearInterval(interval)
  }, [startAt])

  const min = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const sec = String(elapsed % 60).padStart(2, '0')
  return (
    <div className="inline-flex items-center gap-8">
      {/* record 빨간 점 */}
      <div className="w-10 h-10 rounded-full bg-error animate-pulse" />
      {/* 답변 경과 시간 */}
      <span className="text-neutral-subtext font-medium font-mono">
        {min}:{sec}
      </span>
    </div>
  )
}
