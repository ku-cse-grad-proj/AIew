import assert from 'node:assert'
import http from 'node:http'
import { test } from 'node:test'

import { InterviewStep } from '@prisma/client'
import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'

import { build, createTestUserAndToken } from '../../helper'

import {
  QuestionGenerateResponse,
  AiQuestionCategory,
  EvaluationResult,
  TailDecision,
  FollowUp,
  MemoryDump,
} from '@/types/ai.types'

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

// Create an agent that does not use keep-alive connections.
// This is crucial for allowing the test process to exit gracefully.
const httpAgent = new http.Agent({ keepAlive: false })

/**
 * Mocks methods of the aiClientService whose RETURN VALUES are needed to control logic flow.
 * Methods that are "fire-and-forget" (like logging) are NOT mocked,
 * allowing us to verify their side effects (i.e., memory updates).
 * @param app The Fastify instance.
 * @param t The test context.
 * @param evaluationResult A partial EvaluationResult to override defaults.
 */
const mockAiClient = (
  app: FastifyInstance,
  t: test.TestContext,
  evaluationResult: Partial<EvaluationResult>,
) => {
  const originalEvaluateAnswer = app.aiClientService.evaluateAnswer
  const originalGenerateFollowUp = app.aiClientService.generateFollowUpQuestion

  t.after(() => {
    app.aiClientService.evaluateAnswer = originalEvaluateAnswer
    app.aiClientService.generateFollowUpQuestion = originalGenerateFollowUp
  })

  app.aiClientService.evaluateAnswer = async (): Promise<EvaluationResult> => {
    return {
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
    } as EvaluationResult
  }

  app.aiClientService.generateFollowUpQuestion =
    async (): Promise<FollowUp> => {
      return {
        followup_id: 'q1-fu1',
        parent_question_id: 'q1',
        focus_criteria: ['Protocol characteristics'],
        rationale: 'To delve deeper into the technical understanding.',
        question: 'Can you elaborate on the handshake process in TCP?',
        expected_answer_time_sec: 75,
      }
    }
}

test('WebSocket interview flow - happy path (generates follow-up and updates memory)', async (t) => {
  const app: FastifyInstance = await build(t)
  mockAiClient(app, t, { tail_decision: TailDecision.CREATE })

  const addressInfo = app.server.address()
  if (addressInfo === null || typeof addressInfo === 'string') {
    throw new Error('Server address is not available')
  }
  const address = `http://localhost:${addressInfo.port}`

  // 서비스 레이어를 통해 테스트 유저와 세션을 생성
  const { user } = await createTestUserAndToken(app)

  // 테스트 종료 후 유저를 삭제하기 위한 훅 추가
  t.after(async () => {
    await app.prisma.user.delete({ where: { id: user.id } })
  })

  const session = await app.interviewService.initializeSession(user.id, {
    company: { value: 'TestCorp' },
    jobTitle: { value: 'Software Engineer' },
    jobSpec: { value: 'Develop amazing things' },
    idealTalent: { value: 'Proactive and collaborative' },
  })
  const sessionId = session.id

  // Reset AI server memory for this session to ensure a clean slate
  await axios.delete(`${process.env.AI_SERVER_URL}/api/v1/memory-debug/reset`, {
    headers: { 'X-Session-Id': sessionId },
    httpAgent,
  })

  const client: ClientSocket = Client(address, {
    query: { sessionId },
    autoConnect: false,
  })

  const questionsReadyPromise = new Promise<{ steps: InterviewStep[] }>(
    (resolve, reject) => {
      client.on('server:questions-ready', resolve)
      client.on('server:error', reject)
    },
  )

  const connectionPromise = new Promise<void>((resolve) =>
    client.on('connect', resolve),
  )
  client.connect()
  await connectionPromise

  await app.interviewService.saveQuestionsAndNotifyClient(
    sessionId,
    mockGeneratedQuestions,
  )

  const { steps } = await questionsReadyPromise
  const firstStepId = steps[0].id
  const userAnswer = 'This is my test answer for the first question.'

  const nextQuestionPromise = new Promise<{
    step: InterviewStep
    isFollowUp: boolean
  }>((resolve, reject) => {
    client.on('server:next-question', resolve)
    client.on('server:error', reject)
  })

  client.emit('client:submit-answer', {
    stepId: firstStepId,
    answer: userAnswer,
    duration: 42,
  })

  const nextQuestionPayload = await nextQuestionPromise

  assert.ok(nextQuestionPayload)
  assert.strictEqual(nextQuestionPayload.isFollowUp, true)
  assert.strictEqual(nextQuestionPayload.step.parentStepId, firstStepId)
  assert.strictEqual(nextQuestionPayload.step.aiQuestionId, 'q1-fu1')

  // Verify AI server memory
  const memoryResponse = await axios.get<MemoryDump>(
    `${process.env.AI_SERVER_URL}/api/v1/memory-debug/dump`,
    { headers: { 'X-Session-Id': sessionId }, httpAgent },
  )

  const memoryDump = memoryResponse.data
  const aiMessages = memoryDump.messages.filter((m) => m.role === 'ai')

  assert.strictEqual(memoryDump.session_id, sessionId)
  assert.strictEqual(aiMessages.length, 3) // 1. question-shown, 2. user-answer, 3. followup-shown

  const firstAiMsgContent = JSON.parse(aiMessages[0].content)
  assert.strictEqual(
    firstAiMsgContent.main_question_id,
    mockGeneratedQuestions[0].main_question_id,
  )

  const humanMsgContent = JSON.parse(aiMessages[1].content)
  assert.strictEqual(humanMsgContent.answer, userAnswer)

  const secondAiMsgContent = JSON.parse(aiMessages[2].content)
  assert.strictEqual(secondAiMsgContent.main_question_id, 'q1-fu1')

  client.disconnect()
})

test('WebSocket interview flow - skips follow-up', async (t) => {
  const app: FastifyInstance = await build(t)
  mockAiClient(app, t, { tail_decision: TailDecision.SKIP })

  const addressInfo = app.server.address()
  if (addressInfo === null || typeof addressInfo === 'string') {
    throw new Error('Server address is not available')
  }
  const address = `http://localhost:${addressInfo.port}`

  const { user } = await createTestUserAndToken(app)
  t.after(async () => {
    await app.prisma.user.delete({ where: { id: user.id } })
  })

  const session = await app.interviewService.initializeSession(user.id, {
    company: { value: 'TestCorp' },
    jobTitle: { value: 'Software Engineer' },
    jobSpec: { value: 'Develop amazing things' },
    idealTalent: { value: 'Proactive and collaborative' },
  })
  const sessionId = session.id

  const client: ClientSocket = Client(address, {
    query: { sessionId },
    autoConnect: false,
  })

  const questionsReadyPromise = new Promise<{ steps: InterviewStep[] }>(
    (resolve) => client.on('server:questions-ready', resolve),
  )
  const connectionPromise = new Promise<void>((resolve) =>
    client.on('connect', resolve),
  )

  client.connect()
  await connectionPromise

  await app.interviewService.saveQuestionsAndNotifyClient(
    sessionId,
    mockGeneratedQuestions,
  )

  const { steps } = await questionsReadyPromise
  const firstStepId = steps[0].id

  const nextQuestionPromise = new Promise<{
    step: InterviewStep
    isFollowUp: boolean
  }>((resolve) => client.on('server:next-question', resolve))

  client.emit('client:submit-answer', {
    stepId: firstStepId,
    answer: 'A very good answer that does not need a follow-up.',
    duration: 30,
  })

  const nextQuestionPayload = await nextQuestionPromise

  assert.strictEqual(nextQuestionPayload.isFollowUp, false)
  assert.strictEqual(
    nextQuestionPayload.step.question,
    mockGeneratedQuestions[1].question,
  )
  assert.strictEqual(nextQuestionPayload.step.id, steps[1].id)

  client.disconnect()
})

test('WebSocket interview flow - finishes interview', async (t) => {
  const app: FastifyInstance = await build(t)
  mockAiClient(app, t, { tail_decision: TailDecision.SKIP })

  const addressInfo = app.server.address()
  if (addressInfo === null || typeof addressInfo === 'string') {
    throw new Error('Server address is not available')
  }
  const address = `http://localhost:${addressInfo.port}`

  const { user } = await createTestUserAndToken(app)
  t.after(async () => {
    await app.prisma.user.delete({ where: { id: user.id } })
  })

  const session = await app.interviewService.initializeSession(user.id, {
    company: { value: 'TestCorp' },
    jobTitle: { value: 'Software Engineer' },
    jobSpec: { value: 'Develop amazing things' },
    idealTalent: { value: 'Proactive and collaborative' },
  })
  const sessionId = session.id

  const client: ClientSocket = Client(address, {
    query: { sessionId },
    autoConnect: false,
  })

  const questionsReadyPromise = new Promise<{ steps: InterviewStep[] }>(
    (resolve) => client.on('server:questions-ready', resolve),
  )
  const connectionPromise = new Promise<void>((resolve) =>
    client.on('connect', resolve),
  )

  client.connect()
  await connectionPromise

  await app.interviewService.saveQuestionsAndNotifyClient(
    sessionId,
    mockGeneratedQuestions,
  )

  const { steps } = await questionsReadyPromise
  const firstStepId = steps[0].id
  const secondStepId = steps[1].id

  const nextQuestionPromise = new Promise<{
    step: InterviewStep
    isFollowUp: boolean
  }>((resolve) => client.on('server:next-question', resolve))

  client.emit('client:submit-answer', {
    stepId: firstStepId,
    answer: 'A very good answer that does not need a follow-up.',
    duration: 30,
  })
  await nextQuestionPromise

  const interviewFinishedPromise = new Promise<{ sessionId: string }>(
    (resolve) => client.on('server:interview-finished', resolve),
  )

  client.emit('client:submit-answer', {
    stepId: secondStepId,
    answer: 'This is the final answer.',
    duration: 35,
  })

  const finishedPayload = await interviewFinishedPromise

  assert.strictEqual(finishedPayload.sessionId, sessionId)

  const finalSession = await app.prisma.interviewSession.findUnique({
    where: { id: sessionId },
  })
  assert.strictEqual(finalSession?.status, 'COMPLETED')

  client.disconnect()
})
