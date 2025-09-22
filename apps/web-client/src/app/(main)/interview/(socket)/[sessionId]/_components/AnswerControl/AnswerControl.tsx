'use client'

import AnswerButton from './AnswerButton'
import AnswerTimer from './AnswerTimer'
import RedoButton from './RedoButton'

import useAnswerControl from '@/app/hooks/useAnswerControl'

export default function AnswerControl({ className }: { className?: string }) {
  const { handleAnswer, handleRedo, startAt, disabled, isMicPaused } =
    useAnswerControl()
  return (
    <div
      className={`w-full h-full p-24 rounded-[20px] bg-neutral-card relative shadow-box ${className}`}
    >
      {startAt && (
        <div className="w-full h-full flex items-center justify-between">
          <RedoButton onClick={handleRedo} />
          <AnswerTimer />
        </div>
      )}
      <AnswerButton
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        onClick={handleAnswer}
        disabled={disabled}
        isMicPaused={isMicPaused}
      />
    </div>
  )
}
