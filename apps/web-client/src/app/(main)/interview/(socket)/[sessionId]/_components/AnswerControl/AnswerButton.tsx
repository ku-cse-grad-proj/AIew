'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAnswerStore } from '@/app/lib/answerStore'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

/**
 * 답변 시작/종료 버튼
 *
 * stt의 session이 활성화 되어있고, endAt이 null일 때만 버튼을 활성화합니다.
 *  - stt의 session이 비활성화된 경우: 음성 인식이 불가능하므로 답변을 시작할 수 없습니다.
 *  - endAt이 null이 아닌 경우: 제출된 답변이 처리중이므로 새로운 답변을 시작할 수 없습니다.
 *
 * session을 미리 연결하고, 마이크로 음성 인식을 시작/종료합니다.
 *  - session을 연결하는데 시간이 걸리기에 미리 연결해둡니다.
 *  - 마이크를 끈 상태로 session을 연결합니다.
 *
 *  버튼을 클릭하면 stt가 시작됩니다.
 *  - 마이크를 켜서 음성 인식을 시작합니다.
 *  - startAt에 답변 시작 시간이 기록됩니다.
 *
 *  버튼을 다시 클릭하면 stt가 종료됩니다.
 *  - 마이크를 꺼서 음성 인식을 종료합니다.
 *  - endAt에 답변 종료 시간이 기록됩니다.
 *
 * 음성은 인식했으나 텍스트로 변환되지 않은 상태일 수도 있습니다.
 *  - 답변이 종료돼 endAt이 기록되면, stt의 canStopSession이 true가 될 때까지 기다립니다.
 *  - useEffect로 해당 값들의 변경을 감지합니다.
 *  - canStopSession이 true가 되면, submitAnswer를 호출해 답변을 제출합니다.
 *  - startAt, endAt을 answerReset을 이용해 null로 초기화합니다.
 *  - stt session을 disconnect합니다.
 *
 * 각 질문마다 위 과정을 반복합니다.
 *
 * @component
 *
 */

export default function AnswerButton({ className }: { className?: string }) {
  const sttState = useSttStore()
  const { current, submitAnswer } = useInterviewStore(
    useShallow((state) => ({
      current: state.current,
      submitAnswer: state.submitAnswer,
    })),
  )

  const { startAt, endAt, setStartAt, setEndAt, answerReset } = useAnswerStore(
    useShallow((state) => ({
      startAt: state.startAt,
      endAt: state.endAt,
      setStartAt: state.setStartAt,
      setEndAt: state.setEndAt,
      answerReset: state.reset,
    })),
  )

  useEffect(() => {
    if (endAt && sttState.canStopSession) {
      if (!current) return
      const payload = {
        stepId: current.stepId,
        answer: sttState.sentences,
        duration: Math.floor((endAt - (startAt ?? Date.now())) / 1000), //초 단위
        startAt,
        endAt,
      }
      submitAnswer(payload)
      answerReset()
      sttState.disconnect()
    }
  }, [endAt, sttState.canStopSession])

  const handleAnswer = async () => {
    //마이크가 꺼져있다면 마이크를 켜서 답변 시작
    if (sttState.isMicPaused) {
      sttState.resumeMic()
      //답변 시작 시간 기록
      setStartAt(Date.now())
    } else {
      //마이크 종료
      sttState.pauseMic()
      setEndAt(Date.now())
    }
  }

  return (
    <button
      disabled={!sttState.isSessionActive || endAt !== null}
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
