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

import {
  AiQuestionCategory,
  AnswerEvaluationResult,
  FollowUp,
  QuestionGenerateResponse,
  TailDecision,
} from '@/types/ai.types'

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

  // The constructor is now private
  private constructor(client: Socket) {
    this.client = client
  }

  // Static factory method to create and connect a client
  public static create(
    fastify: FastifyInstance,
    token: string,
  ): Promise<WebSocketTestClient> {
    const client = startWebSocketClient(fastify, token)
    return new Promise((resolve, reject) => {
      client.once('connect', () => {
        // Remove the error listener once connected successfully
        client.off('connect_error')
        resolve(new WebSocketTestClient(client))
      })
      client.once('connect_error', (err) => {
        reject(new Error(`WebSocket connection failed: ${err.message}`))
      })
    })
  }

  joinRoom(sessionId: string) {
    this.client.emit('client:join-room', { sessionId })
  }

  ready(sessionId: string) {
    this.client.emit('client:ready', { sessionId })
  }

  submitAnswer(stepId: string, answer: string) {
    const now = Date.now()
    this.client.emit('client:submit-answer', {
      stepId,
      answer,
      duration: 30, // fixed duration for tests
      startAt: now - 30000,
      endAt: now,
    })
  }

  waitForEvent<T>(eventName: string): Promise<T> {
    // console.log(`[Client] Waiting for event: ${eventName}...`)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`[Client] Timeout waiting for event: ${eventName}`)
        reject(new Error(`Event "${eventName}" timed out after 10 seconds`))
      }, 10000) // Increased timeout for longer tests

      // Temporary listener for all events for debugging
      // eslint-disable-next-line
      const debugListener = (event: string, ...args: any[]) => {
        // console.log(`[Client] Received event: ${event}`, args)
      }
      this.client.onAny(debugListener)

      this.client.once(eventName, (data) => {
        // console.log(`[Client] Successfully received event: ${eventName}`, data)
        this.client.offAny(debugListener) // Clean up the debug listener
        clearTimeout(timeout)
        resolve(data)
      })
      this.client.once('server:error', (e) => {
        console.error(`[Client] Received server:error`, e)
        this.client.offAny(debugListener) // Clean up the debug listener
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
    // Restore all mocks before each test to ensure isolation
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks()
  })

  it('should move to the next main question after 3 follow-ups', async () => {
    // console.log('[TEST START] Follow-up limit test starting...')
    const wsClient = await WebSocketTestClient.create(app, testUserToken)
    let session: InterviewSession | null = null
    let followupCounter = 0

    // Mock TTS Service to prevent actual API calls
    vi.spyOn(app.ttsService, 'generate').mockResolvedValue('fake-audio-base64')

    // Mock STT Service to prevent actual API calls in CI
    vi.spyOn(app.interviewService, 'generateSttToken').mockResolvedValue({
      data: { value: 'fake-stt-token' },
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line
      config: {} as any,
    })

    // Mock all necessary AI client methods
    vi.spyOn(app.aiClientService, 'logShownQuestion').mockResolvedValue(
      undefined,
    )
    vi.spyOn(app.aiClientService, 'logUserAnswer').mockResolvedValue(undefined)
    vi.spyOn(app.aiClientService, 'evaluateAnswer').mockImplementation(
      async (req): Promise<AnswerEvaluationResult> => {
        // console.log(`[MOCK] evaluateAnswer called for ${req.question_id}`)
        return {
          question_id: req.question_id,
          category: req.category,
          feedback: 'Good answer, but could be more detailed.',
          tail_decision: TailDecision.CREATE, // Always create a follow-up
          tail_rationale: 'Drill down',
          overall_score: 50,
          strengths: [],
          improvements: ['Needs more depth'],
          red_flags: [],
          criterion_scores: [],
          answer_duration_sec: 30,
        }
      },
    )

    vi.spyOn(
      app.aiClientService,
      'generateFollowUpQuestion',
    ).mockImplementation(async (req): Promise<FollowUp> => {
      followupCounter++

      const mainQuestionId = req.question_id.split('-')[0]

      return {
        followup_id: `${mainQuestionId}-fu${followupCounter}`,
        parent_question_id: req.question_id,
        question: `This is follow-up #${followupCounter}`,
        focus_criteria: [],
        rationale: '',
        expected_answer_time_sec: 30,
      }
    })

    try {
      session = await app.prisma.interviewSession.create({
        data: {
          userId: testUser.id,
          company: 'FollowUpTest',
          title: 'Follow-up Limit Test',
          jobTitle: 'Tester',
          jobSpec: 'Limits',
        },
      })

      wsClient.joinRoom(session.id)
      await wsClient.waitForEvent('server:room-joined')

      // Start listening for questions-ready and trigger the process
      const readyPromise = wsClient.waitForEvent<{
        sessionId: string
        elapsedSec: number
        answeredSteps: InterviewStep[]
      }>('server:questions-ready')

      await app.interviewService.saveQuestionsAndNotifyClient(
        session.id,
        mockGeneratedQuestions,
      )
      const { sessionId, elapsedSec, answeredSteps } = await readyPromise
      expect(sessionId).toBe(session.id)
      expect(elapsedSec).toBe(0)
      expect(answeredSteps).toEqual([])

      // New handshake step: client sends ready, waits for the first question
      const firstQuestionPromise = wsClient.waitForEvent<{
        step: InterviewStep
      }>('server:next-question')
      wsClient.ready(sessionId)
      const { step: firstStep } = await firstQuestionPromise

      let currentStep = firstStep

      // 1st Follow-up
      wsClient.submitAnswer(currentStep.id, 'Answer to q1')
      let nextQuestionPayload = await wsClient.waitForEvent<{
        step: InterviewStep
        isFollowUp: boolean
      }>('server:next-question')
      expect(nextQuestionPayload.isFollowUp).toBe(true)
      expect(nextQuestionPayload.step.aiQuestionId).toBe('q1-fu1')
      currentStep = nextQuestionPayload.step

      // 2nd Follow-up
      wsClient.submitAnswer(currentStep.id, 'Answer to q1-fu1')
      nextQuestionPayload = await wsClient.waitForEvent<{
        step: InterviewStep
        isFollowUp: boolean
      }>('server:next-question')
      expect(nextQuestionPayload.isFollowUp).toBe(true)
      expect(nextQuestionPayload.step.aiQuestionId).toBe('q1-fu2')
      currentStep = nextQuestionPayload.step

      // 3rd Follow-up
      wsClient.submitAnswer(currentStep.id, 'Answer to q1-fu2')
      nextQuestionPayload = await wsClient.waitForEvent<{
        step: InterviewStep
        isFollowUp: boolean
      }>('server:next-question')
      expect(nextQuestionPayload.isFollowUp).toBe(true)
      expect(nextQuestionPayload.step.aiQuestionId).toBe('q1-fu3')
      currentStep = nextQuestionPayload.step

      // 4th answer -> Should move to next MAIN question (q2)
      wsClient.submitAnswer(currentStep.id, 'Answer to q1-fu3')
      nextQuestionPayload = await wsClient.waitForEvent<{
        step: InterviewStep
        isFollowUp: boolean
      }>('server:next-question')

      // *** VERIFICATION POINT ***
      expect(nextQuestionPayload.isFollowUp).toBe(false)
      expect(nextQuestionPayload.step.aiQuestionId).toBe('q2')
    } finally {
      wsClient.disconnect()
      if (session) {
        await app.prisma.interviewSession.deleteMany({
          where: { id: session.id },
        })
      }
    }
  })
})
