'use client'

import Image from 'next/image'
import { useShallow } from 'zustand/shallow'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function AnswerButton({ className }: { className?: string }) {
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
    <button
      disabled={!sttState.isSessionActive}
      onClick={sttState.isMicPaused ? sttState.resumeMic : handleAnswer}
      aria-label={sttState.isMicPaused ? '답변 시작' : '답변 제출'}
      // TODO:: 사용자 음성 크기에 따라 버튼 크기 달라지도록
      className={`w-48 h-48 p-8 rounded-full ${
        sttState.isMicPaused
          ? 'bg-primary'
          : 'bg-primary ring-4 ring-offset-4 ring-primary/40 animate-pulse'
      } ${className}`}
    >
      <Image src={'/icons/mic.svg'} alt={'mic icon'} width={32} height={32} />
    </button>
  )
}
