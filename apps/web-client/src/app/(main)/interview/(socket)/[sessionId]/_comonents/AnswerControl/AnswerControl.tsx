'use client'

import AnswerButton from './AnswerButton'
import AnswerTimer from './AnswerTimer'
import RedoButton from './RedoButton'

import { useSttStore } from '@/app/lib/socket/sttStore'

export default function AnswerControl({ className }: { className?: string }) {
  const isMicPaused = useSttStore((state) => state.isMicPaused)
  return (
    <div
      className={`w-full h-full p-24 rounded-[20px] bg-neutral-card relative shadow-box ${className}`}
    >
      <div className="w-full h-full flex items-center justify-between">
        <RedoButton />
        {!isMicPaused && <AnswerTimer />}
      </div>
      <AnswerButton className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}
