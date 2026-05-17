/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mock socket.io server for interview flow regression tests.
 * Spins up a real socket.io server on a random port so client-side
 * code can run unchanged against it.
 *
 * 옛 PoC `src/__test__/helpers/mockStt.ts` 를 확장.
 */
import { createServer } from 'http'
import type { AddressInfo } from 'net'

import { Server, Socket as ServerSocket } from 'socket.io'

export type MockServerSocket = ServerSocket & {
  emitQuestionsReady: (payload?: Partial<QuestionsReadyPayload>) => void
  emitNextQuestion: (payload?: Partial<NextQuestionInput>) => void
  emitInterviewFinished: () => void
  emitEvaluationFinished: () => void
  emitServerError: (payload?: { code?: string; message?: string }) => void
  /** Wait for the next `client:*` event matching `eventName`. */
  waitForClientEvent: <T = any>(
    eventName: string,
    timeoutMs?: number,
  ) => Promise<T>
}

type QuestionsReadyPayload = {
  sessionId: string
  elapsedSec: number
  answeredSteps: { question: string; tailSteps: { question: string }[] }[]
}

type NextQuestionInput = {
  stepId: string
  question: string
  type: 'basic' | 'technical' | 'experience' | 'personality'
  audioBase64?: string
  isFollowUp?: boolean
  sttToken?: string
  criteria?: string[]
  rationale?: string
}

const DEFAULT_QUESTIONS_READY: QuestionsReadyPayload = {
  sessionId: 'test-session',
  elapsedSec: 0,
  answeredSteps: [],
}

const DEFAULT_NEXT_QUESTION: Required<NextQuestionInput> = {
  stepId: 'step-1',
  question: '자기소개를 해주세요',
  type: 'basic',
  audioBase64: 'AAA',
  isFollowUp: false,
  sttToken: 'mock-stt-token',
  criteria: [],
  rationale: '',
}

export async function startMockIoServer() {
  const httpServer = createServer()
  const io = new Server(httpServer, { cors: { origin: '*' } })

  io.on('connection', (socket) => {
    const s = socket as unknown as MockServerSocket

    s.emitQuestionsReady = (payload = {}) => {
      socket.emit('server:questions-ready', {
        ...DEFAULT_QUESTIONS_READY,
        ...payload,
      })
    }

    s.emitNextQuestion = (payload = {}) => {
      const merged = { ...DEFAULT_NEXT_QUESTION, ...payload }
      socket.emit('server:next-question', {
        step: {
          id: merged.stepId,
          question: merged.question,
          type: merged.type,
          criteria: merged.criteria,
          rationale: merged.rationale,
        },
        audioBase64: merged.audioBase64,
        isFollowUp: merged.isFollowUp,
        sttToken: merged.sttToken,
      })
    }

    s.emitInterviewFinished = () => {
      socket.emit('server:interview-finished')
    }

    s.emitEvaluationFinished = () => {
      socket.emit('server:evaluation-finished')
    }

    s.emitServerError = (payload = {}) => {
      socket.emit('server:error', {
        code: payload.code ?? 'TEST_ERROR',
        message: payload.message ?? 'mock error',
      })
    }

    s.waitForClientEvent = <T = any>(eventName: string, timeoutMs = 1000) => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(
            new Error(
              `Timeout waiting for client event '${eventName}' after ${timeoutMs}ms`,
            ),
          )
        }, timeoutMs)
        socket.once(eventName, (data: T) => {
          clearTimeout(timer)
          resolve(data)
        })
      })
    }
  })

  await new Promise<void>((res) => httpServer.listen(0, () => res()))
  const port = (httpServer.address() as AddressInfo).port
  const url = `http://localhost:${port}`

  const close = () =>
    new Promise<void>((res) => {
      io.close()
      httpServer.close(() => res())
    })

  /** Get the first connected client socket on default namespace. */
  const getClient = (): MockServerSocket | undefined => {
    const sockets = Array.from(io.of('/').sockets.values())
    return sockets[0] as unknown as MockServerSocket | undefined
  }

  /** Wait until a client connects. */
  const waitForClient = (timeoutMs = 1000): Promise<MockServerSocket> => {
    return new Promise((resolve, reject) => {
      const existing = getClient()
      if (existing) return resolve(existing)
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timeout waiting for client connection after ${timeoutMs}ms`,
          ),
        )
      }, timeoutMs)
      io.on('connection', (socket) => {
        clearTimeout(timer)
        resolve(socket as unknown as MockServerSocket)
      })
    })
  }

  return {
    url,
    io,
    close,
    getClient,
    waitForClient,
  }
}

export const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms))
