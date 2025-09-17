'use client'

import { useShallow } from 'zustand/shallow'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function AnswerControl() {
  const sttState = useSttStore()
  const { current, submitAnswer } = useInterviewStore(
    useShallow((state) => ({
      current: state.current,
      submitAnswer: state.submitAnswer,
    })),
  )

  const handleAnswer = async () => {
    sttState.pauseMic()
    if (!current) return
    //TODO:: 면접자가 말한 내용까가 text화 해서 답변 제출할 것
    //현재는 화면에 표시된 문장만 답변으로 제출
    const payload = {
      stepId: current.stepId,
      answer: sttState.sentences,
      duration: 30, //TODO:: 시작 시간과 종료 시간 추가
    }
    submitAnswer(payload)
    sttState.disconnect()
  }

  return (
    <div>
      {sttState.isMicPaused ? (
        <button
          disabled={!sttState.isSessionActive}
          onClick={sttState.resumeMic}
        >
          답변 시작
        </button>
      ) : (
        <button onClick={handleAnswer}>답변 완료</button>
      )}
    </div>
  )
}
