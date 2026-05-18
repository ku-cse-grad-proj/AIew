'use client'

import { InterviewContext } from '../../_machine/interviewContext'

import AnswerButton from './AnswerButton'
import AnswerTimer from './AnswerTimer'
import RedoButton from './RedoButton'

/**
 * Phase 2.2 — useAnswerControl hook 폐기. 머신이 답변 제어를 직접 보유.
 *
 * 클릭 동작:
 * - sttReady 일 때 클릭 → START_ANSWER (preparing / preparedReady 어디서든)
 * - answering 상태에서 클릭 → FINISH_ANSWER
 * - 다시 답변 클릭 → REDO_ANSWER (answering 도중 사용 가능)
 *
 * 버튼 활성화 조건:
 * - UX 개선: TTS audio 재생 종료를 기다리지 않고 STT 가 준비되는 즉시
 *   마이크 활성화. context.sttReady 가 true 면 답변 시작 가능.
 * - answering 중에는 답변 종료 버튼으로 동작.
 *
 * AIEW-237 parallel 재설계 — step 의 sub-state 가 preparing(audio × stt)
 * × preparedReady × answering 로 바뀜. UI 측 isReady 판정은 "step 안에
 * 있고, answering 이 아니며, sttReady=true" 라는 단순 조건으로 통합.
 */
export default function AnswerControl({ className }: { className?: string }) {
  const actor = InterviewContext.useActorRef()

  // "사용자가 실제로 마이크 입력 중" — finishing 의 idle 인 동안만 true.
  // finishing.sttWaiting 또는 stt.transcribing 중인 finishing 진입 직후 부터는
  // 사용자가 답변을 마친 상태이므로 false 로 떨어져 버튼/펄스 즉시 해제된다.
  const isAnswering = InterviewContext.useSelector((state) =>
    state.matches({
      session: { step: { answering: { finishing: 'idle' } } },
    }),
  )
  // 답변 종료 클릭 후 STT 마무리(transcription completed) 대기 구간.
  // 머신의 answering.finishing.sttWaiting 과 1:1 매핑되어 마이크 버튼 disabled
  // + "답변 처리 중..." 텍스트를 즉시 표시한다. (사용자 체감 "버튼 동작 안 함"
  // 방지.)
  const isFinishing = InterviewContext.useSelector((state) =>
    state.matches({
      session: { step: { answering: { finishing: 'sttWaiting' } } },
    }),
  )
  // step 안에 있고 answering 이 아니며 sttReady=true 인 경우 답변 시작 가능.
  // (preparing.audio 가 playing 이든 preparedReady 든 무관 — 머신 step level
  //  의 on.START_ANSWER guard isSttReady 가 동일하게 처리.)
  const isReady = InterviewContext.useSelector(
    (state) =>
      state.context.sttReady &&
      state.matches({ session: 'step' }) &&
      !state.matches({ session: { step: 'answering' } }),
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
      {isFinishing && (
        <div
          className="w-full h-full flex items-center justify-center"
          aria-live="polite"
        >
          <span className="text-neutral-subtext font-medium">
            답변 처리 중...
          </span>
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
