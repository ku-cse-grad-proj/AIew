'use client'
import { io, Socket } from 'socket.io-client'
import { fromCallback } from 'xstate'

import type { CurrentQuestion, InterviewEvent, QuestionBundle } from '../_types'

import { QUESTION_TYPES, QuestionType } from '@/app/_types'

/**
 * Socket.IO 클라이언트 lifecycle 을 관리하는 callback actor.
 *
 * - 서버 이벤트(server:*) → 머신 이벤트 변환
 * - 머신 → actor 메시지 receive 콜백으로 client:* emit
 * - cleanup: removeAllListeners + disconnect (StrictMode 이중 마운트 대비)
 *
 * 옛 `interviewStore.ts:104-223` 의 connect 로직을 actor 안으로 이동.
 * Zustand 모듈 전역(handlersBound)은 closure 로 격리.
 */

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

type QuestionsReadyPayload = {
  answeredSteps: { question: string; tailSteps: { question: string }[] }[]
  elapsedSec: number
  sessionId: string
}

/**
 * actor 가 receive 하는 outgoing 메시지.
 * 머신은 sendTo('socketActor', ...) 로 이 메시지를 보낸다.
 */
export type SocketActorInput = { sessionId: string; url: string }

export type SocketActorMessage =
  | { type: 'ACCESS_INTERVIEW' }
  | {
      type: 'SUBMIT_ANSWER'
      payload: { stepId: string; answer: string; duration: number }
    }
  | { type: 'TICK_ELAPSED'; elapsedSec: number }

export const socketActor = fromCallback<
  InterviewEvent | SocketActorMessage,
  SocketActorInput
>(({ input, sendBack, receive }) => {
  const { sessionId, url } = input

  // closure 보관 — 옛 store 의 모듈 전역 격리
  const questions: QuestionBundle[] = []

  // React 19 / Next.js dev 모드의 이중 effect 로 actor 가 두 번 invoke 되는
  // 경우, io() 핸드셰이크가 cleanup 이후 도착해 orphan socket 이 서버에
  // join 되지 않은 채 남는 문제를 차단. disposed 플래그로 cleanup 이후의
  // connect 콜백을 무시.
  let disposed = false

  const socket: Socket = io(url, { withCredentials: true })

  socket.on('connect', () => {
    if (disposed) {
      socket.disconnect()
      return
    }
    socket.emit('client:join-room', { sessionId })
  })

  socket.on('server:questions-ready', (qr: unknown) => {
    const payload = qr as QuestionsReadyPayload
    // 클라이언트 핸드셰이크 — 옛 store 와 동일하게 즉시 client:ready emit
    socket.emit('client:ready', { sessionId: payload.sessionId ?? sessionId })

    // questions 초기 복원 (재진입 시 서버가 보낸 진행 상태)
    questions.length = 0
    for (const step of payload.answeredSteps ?? []) {
      questions.push({
        main: step.question,
        followUps: step.tailSteps.map((followUp) => followUp.question),
      })
    }

    sendBack({
      type: 'CONNECT',
      payload: {
        elapsedSec: payload.elapsedSec ?? 0,
        questions: questions.map((bundle) => ({
          main: bundle.main,
          followUps: [...bundle.followUps],
        })),
      },
    })
  })

  socket.on('server:next-question', (payload: unknown) => {
    const nq = payload as NextQuestionPayload
    const questionText = nq.step?.question
    if (!questionText) {
      sendBack({
        type: 'SERVER_ERROR',
        payload: {
          code: 'INVALID_QUESTION',
          message: '서버로부터 잘못된 질문이 전달되었습니다',
        },
      })
      return
    }

    // questions 누적 — 옛 store interviewStore.ts:140-194 로직 보존
    if (!nq.isFollowUp) {
      questions.push({ main: questionText, followUps: [] })
    } else {
      if (questions.length === 0) {
        questions.push({
          main: 'Unkown main question',
          followUps: [questionText],
        })
      } else {
        questions[questions.length - 1].followUps.push(questionText)
      }
    }

    const order = questions.reduce(
      (count, bundle) => count + 1 + bundle.followUps.length,
      0,
    )

    const current: CurrentQuestion = {
      stepId: nq.step?.id ?? '',
      text: questionText,
      audioBase64: nq.audioBase64,
      isFollowUp: nq.isFollowUp ?? false,
      order,
      type: QUESTION_TYPES[nq.step.type],
      criteria: nq.step.criteria,
      rationale: nq.step.rationale,
      sttToken: nq.sttToken,
    }

    sendBack({
      type: 'QUESTION_READY',
      payload: {
        current,
        questions: questions.map((bundle) => ({
          main: bundle.main,
          followUps: [...bundle.followUps],
        })),
      },
    })
  })

  socket.on('server:interview-finished', () => {
    sendBack({ type: 'FINISH_INTERVIEW' })
  })

  socket.on('server:evaluation-finished', () => {
    sendBack({ type: 'REPORT_READY' })
  })

  socket.on('server:error', (err: unknown) => {
    const e = (err ?? {}) as { code?: string; message?: string }
    sendBack({
      type: 'SERVER_ERROR',
      payload: {
        code: e.code ?? 'UNKNOWN',
        message: e.message ?? 'Unknown error',
      },
    })
  })

  // 머신 → actor 메시지
  receive((event) => {
    if (event.type === 'ACCESS_INTERVIEW') {
      socket.emit('client:ready', { sessionId })
      return
    }
    if (event.type === 'SUBMIT_ANSWER' && 'payload' in event) {
      socket.emit('client:submit-answer', event.payload)
      return
    }
    if (event.type === 'TICK_ELAPSED' && 'elapsedSec' in event) {
      socket.emit('client:submit-elapsedSec', {
        sessionId,
        elapsedSec: event.elapsedSec,
      })
      return
    }
  })

  return () => {
    disposed = true
    socket.removeAllListeners()
    socket.disconnect()
    // io() 핸드셰이크 도중에 cleanup 되는 케이스 대비. close() 는 underlying
    // engine.io 트랜스포트를 강제 종료해 서버 측 orphan 연결을 방지.
    socket.close()
  }
})
