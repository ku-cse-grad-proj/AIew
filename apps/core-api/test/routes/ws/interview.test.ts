import assert from 'node:assert'
import { test } from 'node:test'

import { InterviewStep } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'

import { build, createTestUserAndToken } from '../../helper'

import { QuestionGenerateResponse, AiQuestionCategory } from '@/types/ai.types'

const mockGeneratedQuestions: QuestionGenerateResponse = [
  {
    main_question_id: '1',
    category: AiQuestionCategory.TECHNICAL,
    question: 'What is the difference between TCP and UDP?',
    criteria: ['Protocol characteristics', 'Use cases'],
    skills: ['Networking'],
    rationale: 'Fundamental networking knowledge is essential.',
    estimated_answer_time_sec: 60,
  },
  {
    main_question_id: '2',
    category: AiQuestionCategory.BEHAVIORAL,
    question: 'Tell me about a time you had a conflict with a coworker.',
    criteria: ['Conflict resolution', 'Communication'],
    skills: ['Teamwork', 'Communication'],
    rationale: 'Assesses interpersonal skills.',
    estimated_answer_time_sec: 40,
  },
]

test('WebSocket interview flow - happy path', async (t) => {
  const app: FastifyInstance = await build(t)
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

  // 웹소켓 클라이언트 생성
  const client: ClientSocket = Client(address, {
    query: { sessionId },
    autoConnect: false,
  })

  // 이벤트와 연결을 기다리기 위한 Promise 세팅
  const questionsReadyPromise = new Promise<{ steps: InterviewStep[] }>(
    (resolve, reject) => {
      client.on('server:questions-ready', resolve)
      client.on('server:error', reject)
      client.on('connect_error', reject)
    },
  )

  const connectionPromise = new Promise<void>((resolve) => {
    client.on('connect', resolve)
  })

  // 연결 요청하고 기다리기
  client.connect()
  await connectionPromise

  // 연결되었을테니 서버로부터 이벤트 트리거
  await app.interviewService.saveQuestionsAndNotifyClient(
    sessionId,
    mockGeneratedQuestions,
  )

  // 'server:questions-ready'를 기다리기
  const questionsReadyPayload = await questionsReadyPromise
  const steps = questionsReadyPayload.steps
  assert.ok(Array.isArray(steps) && steps.length > 0, 'Should receive steps')
  const firstStepId = steps[0].id

  // 사용자의 답변을 submit 하고 다음 질문 기다리기
  const nextQuestionPromise = new Promise<{
    step: InterviewStep
    isFollowUp: boolean
  }>((resolve) => {
    client.on('server:next-question', resolve)
  })

  client.emit('client:submit-answer', {
    stepId: firstStepId,
    answer: 'This is my test answer for the first question.',
    duration: 42,
  })

  const nextQuestionPayload = await nextQuestionPromise

  // 응답 assert
  assert.ok(
    nextQuestionPayload,
    'Should receive a payload for the next question',
  )
  assert.strictEqual(
    typeof nextQuestionPayload.step.id,
    'string',
    'Next step ID should be a string',
  )
  assert.notStrictEqual(
    nextQuestionPayload.step.id,
    firstStepId,
    'Next step ID should be different from the first step ID',
  )
  assert.strictEqual(
    nextQuestionPayload.isFollowUp,
    false,
    'isFollowUp should be false for the next main question',
  )
  assert.strictEqual(
    nextQuestionPayload.step.question,
    mockGeneratedQuestions[1].question,
    'Should receive the second question',
  )

  // 연결 해제
  client.disconnect()
})
