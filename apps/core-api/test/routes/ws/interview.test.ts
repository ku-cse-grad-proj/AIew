import { InterviewSession, InterviewStep, User } from '@prisma/client'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest'

import { build, createTestUserAndToken, FastifyInstance } from '../../helper'

import {
  QuestionGenerateResponse,
  AiQuestionCategory,
  EvaluationResult,
  TailDecision,
  // FollowUp,
} from '@/types/ai.types'

// --- Mocks and Test Data ---

const mockGeneratedQuestions: QuestionGenerateResponse = [
  {
    main_question_id: 'q1',
    category: AiQuestionCategory.TECHNICAL,
    question: 'What is the difference between TCP and UDP?',
    criteria: ['Protocol characteristics', 'Use cases'],
    skills: ['Networking'],
    rationale: 'Fundamental networking knowledge is essential.',
    estimated_answer_time_sec: 60,
  },
  {
    main_question_id: 'q2',
    category: AiQuestionCategory.BEHAVIORAL,
    question: 'Tell me about a time you had a conflict with a coworker.',
    criteria: ['Conflict resolution', 'Communication'],
    skills: ['Teamwork', 'Communication'],
    rationale: 'Assesses interpersonal skills.',
    estimated_answer_time_sec: 40,
  },
]

const mockAiClient = (
  app: FastifyInstance,
  evaluationResult: Partial<EvaluationResult>,
) => {
  vi.spyOn(app.aiClientService, 'evaluateAnswer').mockResolvedValue({
    question_id: 'q1',
    category: AiQuestionCategory.BEHAVIORAL,
    overall_score: 80,
    strengths: ['Clear explanation'],
    improvements: ['Could be more detailed'],
    red_flags: [],
    criterion_scores: [],
    tail_decision: TailDecision.SKIP,
    tail_rationale: 'Answer was sufficient.',
    tail_question: null,
    ...evaluationResult,
  } as EvaluationResult)

  vi.spyOn(app.aiClientService, 'generateFollowUpQuestion').mockResolvedValue({
    followup_id: 'q1-fu1',
    parent_question_id: 'q1',
    focus_criteria: ['Protocol characteristics'],
    rationale: 'To delve deeper into the technical understanding.',
    question: 'Can you elaborate on the handshake process in TCP?',
    expected_answer_time_sec: 75,
  })

  vi.spyOn(app.aiClientService, 'logShownQuestion').mockResolvedValue(undefined)
  vi.spyOn(app.aiClientService, 'logUserAnswer').mockResolvedValue(undefined)
}

// --- WebSocket Test Helper Class ---

class WebSocketTestClient {
  private client: ClientSocket
  private app: FastifyInstance
  private sessionId: string

  constructor(app: FastifyInstance, sessionId: string) {
    this.app = app
    this.sessionId = sessionId
    const addressInfo = app.server.address()
    if (addressInfo === null || typeof addressInfo === 'string') {
      throw new Error('Server address is not available')
    }
    const address = `http://localhost:${addressInfo.port}`
    this.client = Client(address, {
      query: { sessionId },
      autoConnect: false,
      transports: ['websocket'],
    })
  }

  connect() {
    return new Promise<void>((resolve) => {
      this.client.once('connect', resolve)
      this.client.connect()
    })
  }

  disconnect() {
    this.client.disconnect()
  }

  private waitForEvent<T>(eventName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.client.once(eventName, resolve)
      this.client.once('server:error', (e) =>
        reject(new Error(typeof e === 'string' ? e : JSON.stringify(e))),
      )
    })
  }

  async triggerQuestionsAndAwaitForReady(): Promise<{
    steps: InterviewStep[]
  }> {
    const promise = this.waitForEvent<{ steps: InterviewStep[] }>(
      'server:questions-ready',
    )
    await this.app.interviewService.saveQuestionsAndNotifyClient(
      this.sessionId,
      mockGeneratedQuestions,
    )
    return promise
  }

  async submitAnswerAndWaitForNextQuestion(payload: {
    stepId: string
    answer: string
    duration: number
  }): Promise<{ step: InterviewStep; isFollowUp: boolean }> {
    const promise = this.waitForEvent<{
      step: InterviewStep
      isFollowUp: boolean
    }>('server:next-question')
    this.client.emit('client:submit-answer', payload)
    return promise
  }

  async submitAnswerAndWaitForFinish(payload: {
    stepId: string
    answer: string
    duration: number
  }): Promise<{ sessionId: string }> {
    const promise = this.waitForEvent<{ sessionId: string }>(
      'server:interview-finished',
    )
    this.client.emit('client:submit-answer', payload)
    return promise
  }
}

describe('WebSocket interview flow', () => {
  let app: FastifyInstance
  let user: User

  // Run once before all tests in this describe block
  beforeAll(async () => {
    app = await build()
    const testUser = await createTestUserAndToken(app)
    user = testUser.user
  })

  // Run once after all tests in this describe block
  afterAll(async () => {
    await app.prisma.user.delete({ where: { id: user.id } })
    await app.close()
  })

  let session: InterviewSession
  let wsClient: WebSocketTestClient

  // Run before each test
  beforeEach(async () => {
    session = await app.interviewService.initializeSession(user.id, {
      company: { value: 'TestCorp' },
      jobTitle: { value: 'Software Engineer' },
      jobSpec: { value: 'Develop amazing things' },
      idealTalent: { value: 'Proactive and collaborative' },
    })
    wsClient = new WebSocketTestClient(app, session.id)
    await wsClient.connect()
  })

  // Run after each test
  afterEach(async () => {
    vi.restoreAllMocks()
    wsClient.disconnect()
    // Clean up session data, user is cleaned up in afterAll
    await app.prisma.interviewSession.delete({ where: { id: session.id } })
  })

  it('happy path (generates follow-up)', async () => {
    mockAiClient(app, { tail_decision: TailDecision.CREATE })

    const { steps } = await wsClient.triggerQuestionsAndAwaitForReady()
    const firstStepId = steps[0].id
    const userAnswer = 'This is my test answer for the first question.'

    const nextQuestionPayload =
      await wsClient.submitAnswerAndWaitForNextQuestion({
        stepId: firstStepId,
        answer: userAnswer,
        duration: 42,
      })

    expect(nextQuestionPayload).toBeDefined()
    expect(nextQuestionPayload.isFollowUp).toBe(true)
    expect(nextQuestionPayload.step.parentStepId).toBe(firstStepId)
    expect(nextQuestionPayload.step.aiQuestionId).toBe('q1-fu1')
  })

  it('skips follow-up', async () => {
    mockAiClient(app, { tail_decision: TailDecision.SKIP })

    const { steps } = await wsClient.triggerQuestionsAndAwaitForReady()

    const nextQuestionPayload =
      await wsClient.submitAnswerAndWaitForNextQuestion({
        stepId: steps[0].id,
        answer: 'A very good answer that does not need a follow-up.',
        duration: 30,
      })

    expect(nextQuestionPayload.isFollowUp).toBe(false)
    expect(nextQuestionPayload.step.question).toBe(
      mockGeneratedQuestions[1].question,
    )
    expect(nextQuestionPayload.step.id).toBe(steps[1].id)
  })

  it('finishes interview', async () => {
    mockAiClient(app, { tail_decision: TailDecision.SKIP })

    const { steps } = await wsClient.triggerQuestionsAndAwaitForReady()

    const nextQuestionPayload =
      await wsClient.submitAnswerAndWaitForNextQuestion({
        stepId: steps[0].id,
        answer: 'A very good answer that does not need a follow-up.',
        duration: 30,
      })

    const finishedPayload = await wsClient.submitAnswerAndWaitForFinish({
      stepId: nextQuestionPayload.step.id,
      answer: 'This is the final answer.',
      duration: 35,
    })

    expect(finishedPayload.sessionId).toBe(session.id)

    const finalSession = await app.prisma.interviewSession.findUnique({
      where: { id: session.id },
    })
    expect(finalSession?.status).toBe('COMPLETED')
  })
})
