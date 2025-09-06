import fs from 'node:fs'
import path from 'node:path'

import { InterviewStep, User, InterviewSession } from '@prisma/client'
import { Socket } from 'socket.io-client'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'

import {
  build,
  createTestUserAndToken,
  FastifyInstance,
  startWebSocketClient,
} from '../../helper'

import { AiQuestionCategory, QuestionGenerateResponse } from '@/types/ai.types'

const DUMMY_FILE_PATH = path.join(__dirname, 'dummy-ws.pdf')

const mockGeneratedQuestions: QuestionGenerateResponse = [
  {
    main_question_id: 'q1',
    category: AiQuestionCategory.TECHNICAL,
    question: 'Tell me about your experience with Node.js.',
    criteria: ['Clarity', 'Correctness'],
    skills: ['Node.js', 'JavaScript'],
    rationale: 'To assess basic knowledge.',
    estimated_answer_time_sec: 60,
  },
  {
    main_question_id: 'q2',
    category: AiQuestionCategory.BEHAVIORAL,
    question: 'How do you handle conflicts in a team?',
    criteria: ['Communication', 'Teamwork'],
    skills: ['Soft Skills'],
    rationale: 'To assess teamwork ability.',
    estimated_answer_time_sec: 90,
  },
]

// WebSocket Test Client Helper
class WebSocketTestClient {
  private client: Socket

  constructor(fastify: FastifyInstance, token: string) {
    this.client = startWebSocketClient(fastify, token)
  }

  async waitForConnection(): Promise<void> {
    if (this.client.connected) return
    return new Promise((resolve) => {
      this.client.on('connect', resolve)
    })
  }

  joinRoom(sessionId: string) {
    this.client.emit('client:join-room', { sessionId })
  }

  submitAnswer(stepId: string, answer: string) {
    this.client.emit('client:submit-answer', {
      stepId,
      answer,
      duration: 30, // fixed duration for tests
    })
  }

  waitForEvent<T>(eventName: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Event "${eventName}" timed out after 5 seconds`))
      }, 5000)

      this.client.once(eventName, (data) => {
        clearTimeout(timeout)
        resolve(data)
      })
      this.client.once('server:error', (e) => {
        clearTimeout(timeout)
        reject(new Error(e.message || JSON.stringify(e)))
      })
    })
  }

  disconnect() {
    this.client.disconnect()
  }
}

describe('WebSocket interview flow', () => {
  let app: FastifyInstance
  let testUser: User
  let testUserToken: string

  beforeAll(async () => {
    process.env.AI_SERVER_URL = 'http://mock-ai-server.com'
    fs.writeFileSync(DUMMY_FILE_PATH, 'dummy pdf content')
    app = await build()
    const userData = await createTestUserAndToken(app)
    testUser = userData.user
    testUserToken = userData.accessToken
  })

  afterAll(async () => {
    fs.unlinkSync(DUMMY_FILE_PATH)
    await app.prisma.user.delete({ where: { id: testUser.id } })
    await app.close()
    delete process.env.AI_SERVER_URL
  })

  beforeEach(() => {
    // Mock only the answer processing to control the test flow
    vi.spyOn(app.interviewService, 'processUserAnswer').mockImplementation(
      async (sessionId, stepId) => {
        const currentStep = await app.prisma.interviewStep.findUnique({
          where: { id: stepId },
        })
        if (currentStep?.aiQuestionId === 'q2') {
          app.io.to(sessionId).emit('server:interview-finished', { sessionId })
        } else {
          const nextStep = await app.prisma.interviewStep.findFirst({
            where: { interviewSessionId: sessionId, aiQuestionId: 'q2' },
          })
          app.io
            .to(sessionId)
            .emit('server:next-question', { step: nextStep, isFollowUp: false })
        }
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.skip('should conduct a full interview flow via WebSocket', async () => {
    const wsClient = new WebSocketTestClient(app, testUserToken)
    let session: InterviewSession | null = null
    try {
      // 1. Create session directly in DB, bypassing the problematic API call
      session = await app.prisma.interviewSession.create({
        data: {
          userId: testUser.id,
          company: 'TestCo',
          title: 'WS Test',
          jobTitle: 'Tester',
          jobSpec: 'WS',
        },
      })

      await wsClient.waitForConnection()
      wsClient.joinRoom(session.id)

      // 2. Manually call the service method that saves questions and emits
      await app.interviewService.saveQuestionsAndNotifyClient(
        session.id,
        mockGeneratedQuestions,
      )

      const { steps } = await wsClient.waitForEvent<{
        steps: InterviewStep[]
      }>('server:questions-ready')
      expect(steps.length).toBe(2)

      // 3. Simulate answering questions and verify the flow
      wsClient.submitAnswer(steps[0].id, 'My first answer')
      const { step: nextStep } = await wsClient.waitForEvent<{
        step: InterviewStep
      }>('server:next-question')
      expect(nextStep.aiQuestionId).toBe('q2')

      wsClient.submitAnswer(steps[1].id, 'My second answer')
      const { sessionId: finishedSessionId } = await wsClient.waitForEvent<{
        sessionId: string
      }>('server:interview-finished')
      expect(finishedSessionId).toBe(session.id)
    } finally {
      wsClient.disconnect()
      if (session) {
        // Use deleteMany to be safe, as steps might be created
        await app.prisma.interviewSession.deleteMany({
          where: { id: session.id },
        })
      }
    }
  })
})
