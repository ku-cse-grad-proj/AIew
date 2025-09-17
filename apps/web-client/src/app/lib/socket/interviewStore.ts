'use client'
import { create } from 'zustand'

import { interviewSocket } from './interviewSocket'
import type { IInterviewSocket } from './types'

// 최소 상태 타입들 (필요 시 프로젝트 타입에 맞춰 확장)
type Questions = QuestionBundles

type NextQuestionPayload = {
  step: { id: string; question?: string }
  audioBase64?: string
  isFollowUp?: boolean
}

type CurrentQuestion = {
  stepId: string
  text?: string
  audioBase64?: string
  isFollowUp?: boolean
}

type ServerError = { code: string; message: string } | null

type InterviewState = {
  sessionId: string
  isConnected: boolean
  questions: Questions | null
  current?: CurrentQuestion
  finished: boolean
  error: ServerError

  // actions
  connect: (sessionId: string, s?: IInterviewSocket) => void
  disconnect: (s?: IInterviewSocket) => void
  submitAnswer: (
    payload: { stepId: string; answer: string; duration: number },
    s?: IInterviewSocket,
  ) => void
}

// 핸들러 중복 바인딩 방지용 플래그
const handlersBound = { value: false }
export const useInterviewStore = create<InterviewState>((set, get, store) => ({
  sessionId: '',
  isConnected: false,
  questions: null,
  current: undefined,
  finished: false,
  error: null,

  disconnect: (s = interviewSocket) => {
    s.disconnect()
    set(store.getInitialState()) //store, 초기값으로 설정
    handlersBound.value = false // removeAllListeners() 했으므로 재바인딩 허용
  },

  // 5) 답변 제출
  submitAnswer: (payload, s = interviewSocket) => {
    s.emit('client:submit-answer', payload)
  },

  connect: (sessionId, s = interviewSocket) => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000'

    // 1) 연결 수립 (+ 연결 시 방 참가는 socket 구현이 처리)
    s.connect(url, sessionId)

    const playAudio = (base64: string | undefined) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`)
      audio.play()
    }

    try {
      // 2~8) 이벤트 핸들러 (중복 등록 방지)
      if (handlersBound.value) return

      // 연결/해제 상태
      s.on('connect', () =>
        set({ isConnected: true, error: null, sessionId: sessionId }),
      )
      s.on('disconnect', () => set({ isConnected: false }))

      // 3) 질문 목록 수신
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s.on('server:questions-ready', (q: any) => {
        const firstStep = q.steps[0]

        return set({
          questions: q as Questions,
          finished: false,
          current: {
            stepId: firstStep.id,
            text: firstStep.question,
            isFollowUp: false, //첫 질문이기에 꼬리질문 아님
          },
        })
      })

      // 4) 첫 질문 음성 수신
      s.on('server:question-audio-ready', (data: unknown) => {
        playAudio((data as CurrentQuestion)?.audioBase64)
        set((prev) => ({
          current: {
            ...(prev.current ?? {}),
            stepId: (data as CurrentQuestion)?.stepId,
            audioBase64: (data as CurrentQuestion)?.audioBase64,
          },
        }))
      })

      // 6) 다음 질문 수신 (텍스트+음성) 또는 꼬리질문
      s.on('server:next-question', (nq: unknown) => {
        playAudio((nq as NextQuestionPayload).audioBase64)

        set(() => ({
          current: {
            stepId: (nq as NextQuestionPayload)?.step?.id ?? '',
            text: (nq as NextQuestionPayload)?.step?.question,
            audioBase64: (nq as NextQuestionPayload)?.audioBase64,
            isFollowUp: (nq as NextQuestionPayload)?.isFollowUp ?? false,
          },
        }))
      })

      // 종료
      s.on('server:interview-finished', () => set({ finished: true }))

      // 에러 처리
      s.on('server:error', (err: unknown) => {
        set({
          error: (err as ServerError) ?? {
            code: 'UNKNOWN',
            message: 'Unknown error',
          },
        })
        throw new Error('질문 처리 중 문제가 발생했습니다', err as Error)
      })

      handlersBound.value = true
    } catch (error) {
      console.error(error)
    }
  },
}))
