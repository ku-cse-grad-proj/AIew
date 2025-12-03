'use client'
import { env } from 'next-runtime-env'
import { create } from 'zustand'

import { interviewSocket } from './interviewSocket'
import type { IInterviewSocket } from './types'

import { QUESTION_TYPES, QuestionType, QuestionTypeLabel } from '@/app/_types'

type NextQuestionPayload = {
  step: {
    id: string
    question?: string
    type: QuestionType
    criteria: string[]
    rationale: string
  }
  audioBase64?: string
  isFollowUp?: boolean
  sttToken: string
}

type QuestionReadyPayload = {
  answeredSteps: { question: string; tailSteps: { question: string }[] }[]
  elapsedSec: number
  sessionId: string
}

type CurrentQuestion = {
  stepId: string
  text?: string
  audioBase64?: string
  isFollowUp?: boolean
  order: number
  type: QuestionTypeLabel
  criteria: string[]
  rationale: string
  sttToken: string
}

type ServerError = { code: string; message: string } | null

export type QuestionBundle = { main: string; followUps: string[] }

type InterviewState = {
  sessionId: string
  isConnected: boolean
  questions: QuestionBundle[]
  current?: CurrentQuestion
  finished: boolean
  reportReady: boolean
  elapsedSec: number
  error: ServerError

  // actions
  connect: (
    sessionId: string,
    revalidate: (id: string) => void,
    s?: IInterviewSocket,
  ) => void
  disconnect: (s?: IInterviewSocket) => void
  emitElapsedSec: (s?: IInterviewSocket) => void
  submitAnswer: (
    payload: { stepId: string; answer: string; duration: number },
    s?: IInterviewSocket,
  ) => void
  setElapsedSec: (sec: number) => void
}

// 핸들러 중복 바인딩 방지용 플래그
const handlersBound = { value: false }
export const useInterviewStore = create<InterviewState>((set, get, store) => ({
  sessionId: '',
  isConnected: false,
  questions: [],
  current: undefined,
  finished: false,
  reportReady: false,
  elapsedSec: 0,
  error: null,

  disconnect: (s = interviewSocket) => {
    get().emitElapsedSec()
    s.disconnect()
    set(store.getInitialState()) //store, 초기값으로 설정
    handlersBound.value = false // removeAllListeners() 했으므로 재바인딩 허용
  },

  // 5) 답변 제출
  submitAnswer: (payload, s = interviewSocket) => {
    s.emit('client:submit-answer', payload)
    get().emitElapsedSec() //답변 제출 시점의 경과 시간 전송
  },

  emitElapsedSec: (s = interviewSocket) => {
    s.emit('client:submit-elapsedSec', {
      sessionId: get().sessionId,
      elapsedSec: get().elapsedSec,
    })
  },

  setElapsedSec: (sec) => set({ elapsedSec: sec }),

  connect: (sessionId, revalidate, s = interviewSocket) => {
    const url = env('NEXT_PUBLIC_SOCKET_URL') ?? ''

    // 1) 연결 수립 (+ 연결 시 방 참가는 socket 구현이 처리)
    s.connect(url, sessionId)

    try {
      // 2~8) 이벤트 핸들러 (중복 등록 방지)
      if (handlersBound.value) return

      // 연결/해제 상태
      s.on('connect', () =>
        set({ isConnected: true, error: null, sessionId: sessionId }),
      )
      s.on('disconnect', () => set({ isConnected: false }))

      // 서버로부터 질문 생성 완료 신호 수신
      // eslint-disable-next-line
      // @ts-ignore
      s.on('server:questions-ready', (qr: QuestionReadyPayload) => {
        // 클라이언트가 준비되었음을 서버에 알림 (핸드셰이크)
        s.emit('client:ready', { sessionId: qr.sessionId })
        set({
          elapsedSec: qr.elapsedSec,
          //answeredSteps to QuestionBundle type
          questions: qr.answeredSteps.map((main) => ({
            main: main.question,
            followUps: main.tailSteps.map((followUp) => followUp.question),
          })),
        })
      })

      // 다음 질문 수신 (첫 질문 포함)
      s.on('server:next-question', (payload: unknown) => {
        const nq = payload as NextQuestionPayload

        set((state) => {
          const questionText = nq.step?.question
          if (!questionText) {
            throw new Error('서버로부터 잘못된 질문이 전달되었습니다')
          }

          //Questions 깊은 복사
          const nextQuestions = state.questions.map((bundle) => ({
            main: bundle.main,
            followUps: [...bundle.followUps],
          }))

          //TODO: questions 초기값 설정하기

          // 메인 질문인 경우
          if (!nq.isFollowUp) {
            nextQuestions.push({ main: questionText, followUps: [] })
          } else {
            // 꼬리 질문인 경우
            // 만약 꼬리 질문부터 오는 경우를 대비해 방어적 코딩
            if (nextQuestions.length === 0) {
              nextQuestions.push({
                main: 'Unkown main question',
                followUps: [questionText],
              })
            } else {
              nextQuestions[nextQuestions.length - 1].followUps.push(
                questionText,
              )
            }
          }

          //순번 정의
          const order = nextQuestions.reduce(
            (count, bundle) => count + 1 + bundle.followUps.length,
            0,
          )

          return {
            questions: nextQuestions,
            finished: false,
            current: {
              stepId: nq.step?.id ?? '',
              text: questionText,
              audioBase64: nq.audioBase64,
              isFollowUp: nq.isFollowUp ?? false,
              order,
              type: QUESTION_TYPES[nq.step.type],
              criteria: nq.step.criteria,
              rationale: nq.step.rationale,
              sttToken: nq.sttToken,
            },
          }
        })
      })

      // 종료
      s.on('server:interview-finished', () => {
        revalidate(get().sessionId)
        set({ finished: true })
      })

      // reports 준비 완료
      s.on('server:evaluation-finished', () => {
        revalidate(get().sessionId)
        set({ reportReady: true })
      })

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
