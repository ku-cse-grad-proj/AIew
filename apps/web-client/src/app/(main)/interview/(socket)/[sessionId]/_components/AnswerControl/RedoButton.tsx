'use client'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import Redo from '@/../public/icons/redo.svg'
import { useAnswerStore } from '@/app/lib/answerStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function RedoButton() {
  const { setSentences, pauseMic, canStopSession } = useSttStore(
    useShallow((state) => ({
      setSentences: state.setSentences,
      resumeMic: state.resumeMic,
      pauseMic: state.pauseMic,
      canStopSession: state.canStopSession,
    })),
  )
  const { endAt, setIsRedo, setEndAt, answerReset } = useAnswerStore(
    useShallow((state) => ({
      endAt: state.endAt,
      setIsRedo: state.setIsRedo,
      setStartAt: state.setStartAt,
      setEndAt: state.setEndAt,
      answerReset: state.reset,
    })),
  )

  useEffect(() => {
    if (endAt && canStopSession) {
      //재실행 클릭 이전 문장을 모두 text로 변환 후 초기화 로직 실행
      setSentences('')
      answerReset()
      setIsRedo(false)
    }
  }, [endAt, canStopSession])

  const handleRedo = (e: React.MouseEvent<HTMLButtonElement>) => {
    //재확인
    const ok = confirm('Are you sure you want to ask the question again?')
    if (!ok) {
      e.stopPropagation()
      return
    }

    //마이크 종료
    pauseMic()
    setIsRedo(true)
    setEndAt(Date.now())
  }
  return (
    <button
      className="px-16 py-10 inline-flex items-center gap-8 bg-neutral-background rounded-[10px]"
      onClick={handleRedo}
    >
      <Redo width={20} height={20} />
      <span className="text-neutral-subtext">Redo Answer</span>
    </button>
  )
}
