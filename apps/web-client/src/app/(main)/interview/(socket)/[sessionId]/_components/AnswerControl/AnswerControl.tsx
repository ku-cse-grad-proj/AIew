'use client'

import { InterviewContext } from '../../_machine/interviewContext'

import AnswerButton from './AnswerButton'
import AnswerTimer from './AnswerTimer'
import RedoButton from './RedoButton'

/**
 * Phase 2.2 — useAnswerControl hook 폐기. 머신이 답변 제어를 직접 보유.
 *
 * 클릭 동작:
 * - ready 상태에서 클릭 → START_ANSWER
 * - answering 상태에서 클릭 → FINISH_ANSWER
 * - 다시 답변 클릭 → REDO_ANSWER (answering 도중 사용 가능)
 *
 * 버튼 활성화 조건:
 * - 머신이 `step.ready` 또는 `step.answering` 일 때만 클릭 가능.
 */
export default function AnswerControl({ className }: { className?: string }) {
  const actor = InterviewContext.useActorRef()

  const isAnswering = InterviewContext.useSelector((state) =>
    state.matches({ session: { step: 'answering' } }),
  )
  const isReady = InterviewContext.useSelector((state) =>
    state.matches({ session: { step: 'ready' } }),
  )
  const startAt = InterviewContext.useSelector(
    (state) => state.context.answer.startAt,
  )

  const handleAnswer = () => {
    if (isReady) {
      actor.send({ type: 'START_ANSWER' })
      return
    }
    if (isAnswering) {
      actor.send({ type: 'FINISH_ANSWER' })
    }
  }

  const handleRedo = (e: React.MouseEvent<HTMLButtonElement>) => {
    const ok = confirm('Are you sure you want to ask the question again?')
    if (!ok) {
      e.stopPropagation()
      return
    }
    actor.send({ type: 'REDO_ANSWER' })
  }

  const disabled = !isReady && !isAnswering
  const isMicPaused = !isAnswering

  return (
    <div
      className={`w-full h-full p-24 rounded-[20px] bg-neutral-card relative shadow-box ${className}`}
    >
      {isAnswering && startAt > 0 && (
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
