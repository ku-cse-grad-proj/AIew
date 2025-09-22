'use client'

import Image from 'next/image'
import { useShallow } from 'zustand/shallow'

import { useAnswerStore } from '@/app/lib/answerStore'
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

  const setStartAt = useAnswerStore((state) => state.setStartAt)

  const handleAnswer = async () => {
    //마이크가 꺼져있다면 마이크를 켜서 답변 시작
    if (sttState.isMicPaused) {
      sttState.resumeMic()
      //답변 시작 시간 기록
      setStartAt(Date.now())
    } else {
      //마이크가 켜져있다면 답변 종료

      //답변 시간 계산
      const startAt = useAnswerStore.getState().startAt ?? Date.now()
      const endAt = Date.now()
      const duration = Math.floor((endAt - startAt) / 1000) //초 단위, 소수점 반환시 오류 발생
      setStartAt(null)

      //마이크 종료
      sttState.pauseMic()
      if (!current) return

      //TODO:: 면접자가 말한 내용까가 text화 해서 답변 제출할 것
      //현재는 화면에 표시된 문장만 답변으로 제출
      const payload = {
        stepId: current.stepId,
        answer: sttState.sentences,
        duration,
        startAt,
        endAt,
      }
      submitAnswer(payload)
      sttState.disconnect()
    }
  }

  return (
    <button
      disabled={!sttState.isSessionActive}
      onClick={handleAnswer}
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
