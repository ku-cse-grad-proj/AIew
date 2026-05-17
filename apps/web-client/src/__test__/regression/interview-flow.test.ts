/**
 * Interview flow regression tests — Zustand baseline.
 *
 * 목적: 현재 main(interviewStore + InterviewSocket)의 정상 흐름 동작을
 * 머신 교체 전에 회귀 안전망으로 잡아둠. 머신 도입 후 SocketActor 가
 * 같은 외부 동작(서버 push → store 갱신)을 보존하면 같은 테스트가 계속
 * 통과해야 함.
 *
 * 알려진 버그(빈 답변 / navigation race)는 의도된 수정 대상이라
 * 본 회귀 테스트에 포함하지 않음.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { startMockIoServer, wait } from '../helpers/mockSocketServer'

const mocks = vi.hoisted(() => ({ MOCK_URL: '' }))

vi.mock('next-runtime-env', () => ({
  env: (key: string) =>
    key === 'NEXT_PUBLIC_SOCKET_URL' ? mocks.MOCK_URL : '',
}))

// store 가 mock 적용된 next-runtime-env 를 import 하도록 mock 선언 뒤에 import.
import { InterviewSocket } from '@/app/lib/socket/interviewSocket'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'

describe('interview flow regression (Zustand baseline)', () => {
  let server: Awaited<ReturnType<typeof startMockIoServer>>
  let socket: InterviewSocket

  beforeEach(async () => {
    // 매 테스트마다 새 server 인스턴스 — 이전 테스트의 socket 잔존 격리
    server = await startMockIoServer()
    mocks.MOCK_URL = server.url
    socket = new InterviewSocket()
    useInterviewStore.setState(useInterviewStore.getInitialState())
  })

  afterEach(async () => {
    try {
      useInterviewStore.getState().disconnect(socket)
    } catch {
      // ignore
    }
    socket.disconnect()
    await server.close()
  })

  it('golden path: 진입 → 질문 2개 → 종료 → 보고서 준비', async () => {
    const revalidate = vi.fn()

    // 1. client 가 server 에 connect
    useInterviewStore.getState().connect('test-session', revalidate, socket)
    const clientSock = await server.waitForClient()
    await wait()

    // 2. server → questions-ready (handshake 트리거)
    const clientReadyAck = clientSock.waitForClientEvent<{ sessionId: string }>(
      'client:ready',
    )
    clientSock.emitQuestionsReady({
      sessionId: 'test-session',
      elapsedSec: 0,
      answeredSteps: [],
    })
    const ackPayload = await clientReadyAck
    expect(ackPayload.sessionId).toBe('test-session')

    const stateAfterReady = useInterviewStore.getState()
    expect(stateAfterReady.isConnected).toBe(true)
    expect(stateAfterReady.sessionId).toBe('test-session')
    expect(stateAfterReady.elapsedSec).toBe(0)
    expect(stateAfterReady.finished).toBe(false)
    expect(stateAfterReady.reportReady).toBe(false)

    // 3. server → next-question (1번)
    clientSock.emitNextQuestion({
      stepId: 'step-1',
      question: '자기소개를 해주세요',
    })
    await wait()

    const stateAfterQ1 = useInterviewStore.getState()
    expect(stateAfterQ1.current?.stepId).toBe('step-1')
    expect(stateAfterQ1.current?.text).toBe('자기소개를 해주세요')
    expect(stateAfterQ1.questions).toHaveLength(1)
    expect(stateAfterQ1.questions[0].main).toBe('자기소개를 해주세요')
    expect(stateAfterQ1.finished).toBe(false)

    // 4. client 가 답변 제출
    const submit1 = clientSock.waitForClientEvent<{
      stepId: string
      answer: string
      duration: number
    }>('client:submit-answer')
    useInterviewStore
      .getState()
      .submitAnswer(
        { stepId: 'step-1', answer: 'A1 답변', duration: 5 },
        socket,
      )
    const submit1Payload = await submit1
    expect(submit1Payload).toMatchObject({
      stepId: 'step-1',
      answer: 'A1 답변',
      duration: 5,
    })

    // 5. server → next-question (2번)
    clientSock.emitNextQuestion({ stepId: 'step-2', question: 'Q2 입니다' })
    await wait()

    const stateAfterQ2 = useInterviewStore.getState()
    expect(stateAfterQ2.current?.stepId).toBe('step-2')
    expect(stateAfterQ2.questions).toHaveLength(2)
    expect(stateAfterQ2.questions[1].main).toBe('Q2 입니다')

    // 6. client → 답변 2 제출 → server → interview-finished
    const submit2 = clientSock.waitForClientEvent('client:submit-answer')
    useInterviewStore
      .getState()
      .submitAnswer(
        { stepId: 'step-2', answer: 'A2 답변', duration: 7 },
        socket,
      )
    await submit2

    clientSock.emitInterviewFinished()
    await wait()

    const stateAfterFinish = useInterviewStore.getState()
    expect(stateAfterFinish.finished).toBe(true)
    expect(stateAfterFinish.reportReady).toBe(false)
    expect(revalidate).toHaveBeenCalledWith('test-session')

    // 7. server → evaluation-finished
    clientSock.emitEvaluationFinished()
    await wait()

    const stateAfterEval = useInterviewStore.getState()
    expect(stateAfterEval.reportReady).toBe(true)
    expect(revalidate).toHaveBeenCalledTimes(2)
  })

  it('edge case 1: TTS 재생 중 다음 질문 도착 시 둘 다 questions 에 push (현재 동작 보존)', async () => {
    const revalidate = vi.fn()
    useInterviewStore.getState().connect('test-session', revalidate, socket)
    const clientSock = await server.waitForClient()
    await wait()

    const clientReadyAck = clientSock.waitForClientEvent('client:ready')
    clientSock.emitQuestionsReady({ sessionId: 'test-session' })
    await clientReadyAck

    // next-question 두 번을 거의 동시에 (서버 push 가 빠르게 두 번)
    clientSock.emitNextQuestion({
      stepId: 'step-1',
      question: 'Q1',
      audioBase64: 'AAA',
    })
    clientSock.emitNextQuestion({
      stepId: 'step-2',
      question: 'Q2',
      audioBase64: 'BBB',
    })
    await wait()

    // 두 질문 모두 questions 에 누적, current 는 가장 마지막
    const s = useInterviewStore.getState()
    expect(s.questions).toHaveLength(2)
    expect(s.questions[0].main).toBe('Q1')
    expect(s.questions[1].main).toBe('Q2')
    expect(s.current?.stepId).toBe('step-2')
    expect(s.current?.audioBase64).toBe('BBB')
  })

  it('edge case 2: server:error 수신 시 store.error 갱신 (다른 상태는 유지)', async () => {
    // 현재 store 는 server:error 처리 후 listener 안에서 throw 함
    // (interviewStore.ts:216). 회귀 안전망에서는 이 throw 동작도 그대로 보존하되
    // 테스트 runner 가 fail 처리하지 않도록 일시적으로 swallow.
    const noopUncaught = () => {}
    process.on('uncaughtException', noopUncaught)

    try {
      const revalidate = vi.fn()
      useInterviewStore.getState().connect('test-session', revalidate, socket)
      const clientSock = await server.waitForClient()
      await wait()

      const clientReadyAck = clientSock.waitForClientEvent('client:ready')
      clientSock.emitQuestionsReady({ sessionId: 'test-session' })
      await clientReadyAck

      // 정상 next-question 1회 받은 상태에서 server:error
      clientSock.emitNextQuestion({ stepId: 'step-1', question: 'Q1' })
      await wait()
      expect(useInterviewStore.getState().current?.stepId).toBe('step-1')

      clientSock.emitServerError({ code: 'STT_TIMEOUT', message: '전사 실패' })
      await wait()

      const s = useInterviewStore.getState()
      expect(s.error).toEqual({ code: 'STT_TIMEOUT', message: '전사 실패' })
      // 다른 상태는 보존
      expect(s.isConnected).toBe(true)
      expect(s.sessionId).toBe('test-session')
      expect(s.current?.stepId).toBe('step-1')
      expect(s.finished).toBe(false)
    } finally {
      process.off('uncaughtException', noopUncaught)
    }
  })

  it('edge case 3: 꼬리 질문(isFollowUp=true) 도착 시 마지막 main 의 followUps 에 push', async () => {
    const revalidate = vi.fn()
    useInterviewStore.getState().connect('test-session', revalidate, socket)
    const clientSock = await server.waitForClient()
    await wait()

    const clientReadyAck = clientSock.waitForClientEvent('client:ready')
    clientSock.emitQuestionsReady({ sessionId: 'test-session' })
    await clientReadyAck

    // 메인 질문
    clientSock.emitNextQuestion({
      stepId: 'step-1',
      question: 'main Q',
      isFollowUp: false,
    })
    await wait()
    // 꼬리 질문
    clientSock.emitNextQuestion({
      stepId: 'step-1-tail-1',
      question: 'follow up Q',
      isFollowUp: true,
    })
    await wait()

    const s = useInterviewStore.getState()
    expect(s.questions).toHaveLength(1)
    expect(s.questions[0].main).toBe('main Q')
    expect(s.questions[0].followUps).toEqual(['follow up Q'])
    expect(s.current?.stepId).toBe('step-1-tail-1')
    expect(s.current?.isFollowUp).toBe(true)
  })
})
