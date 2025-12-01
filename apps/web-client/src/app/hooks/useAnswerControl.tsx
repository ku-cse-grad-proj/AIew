'use client'

import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAnswerStore } from '../lib/answerStore'
import { useInterviewStore } from '../lib/socket/interviewStore'
import { useSttStore } from '../lib/socket/sttStore'

/**
 * 답변 관련 커스텀 훅
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
 *  - redo 상태가 아닌지 확인합니다.
 *  - canStopSession이 true가 되면, submitAnswer를 호출해 답변을 제출합니다.
 *  - startAt, endAt을 answerReset을 이용해 null로 초기화합니다.
 *  - stt session을 disconnect합니다.
 *
 * redo 버튼을 클릭하면
 *  - 답변 제출을 하지 않고 문장만 초기화합니다.
 *
 * 각 질문마다 위 과정을 반복합니다.
 *
 * @hook
 *
 */

export default function useAnswerControl() {
  const {
    isMicPaused,
    isSessionActive,
    sentences,
    setSentences,
    pauseMic,
    resumeMic,
    canStopSession,
    disconnect,
  } = useSttStore(
    useShallow((state) => ({
      isMicPaused: state.isMicPaused,
      isSessionActive: state.isSessionActive,
      sentences: state.sentences,
      setSentences: state.setSentences,
      resumeMic: state.resumeMic,
      pauseMic: state.pauseMic,
      canStopSession: state.canStopSession,
      disconnect: state.disconnect,
    })),
  )
  const { current, submitAnswer } = useInterviewStore(
    useShallow((state) => ({
      current: state.current,
      submitAnswer: state.submitAnswer,
    })),
  )

  const {
    isRedo,
    startAt,
    endAt,
    setIsRedo,
    startAnswer,
    setEndAt,
    answerReset,
  } = useAnswerStore(
    useShallow((state) => ({
      isRedo: state.isRedo,
      startAt: state.startAt,
      endAt: state.endAt,
      setIsRedo: state.setIsRedo,
      startAnswer: state.startAnswer,
      setEndAt: state.setEndAt,
      answerReset: state.reset,
    })),
  )

  const submit = () => {
    if (!current || !endAt) return
    const payload = {
      stepId: current.stepId,
      answer: sentences,
      duration: Math.floor((endAt - (startAt ?? Date.now())) / 1000), //초 단위
      startAt,
      endAt,
    }
    submitAnswer(payload)
    disconnect()
  }

  useEffect(() => {
    if (endAt && canStopSession) {
      // 만약 재답변이면 문장만 초기화하고, 아니라면 답변 제출
      if (isRedo) {
        setSentences('')
        setIsRedo(false)
      } else {
        submit()
      }

      answerReset()
    }
  }, [endAt, canStopSession])

  const endAnswer = () => {
    //마이크 종료
    pauseMic()
    setEndAt(Date.now())
  }

  const handleAnswer = async () => {
    //마이크가 꺼져있다면 마이크를 켜서 답변 시작
    if (isMicPaused) {
      resumeMic()
      //답변 시작 시간 기록
      if (!current?.stepId) {
        throw new Error('stepId가 없어 답변을 시작할 수 없습니다.')
      }
      startAnswer(current?.stepId, Date.now())
    } else {
      endAnswer()
    }
  }

  const handleRedo = (e: React.MouseEvent<HTMLButtonElement>) => {
    //재확인
    const ok = confirm('Are you sure you want to ask the question again?')
    if (!ok) {
      e.stopPropagation()
      return
    }

    setIsRedo(true)
    endAnswer()
  }

  const disabled = !isSessionActive || endAt !== null

  return {
    handleAnswer,
    handleRedo,
    disabled,
    isSessionActive,
    isMicPaused,
    endAt,
    startAt,
  }
}
