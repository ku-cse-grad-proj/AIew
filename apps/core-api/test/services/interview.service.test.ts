// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { User } from '@prisma/client'
import { FastifyInstance } from 'fastify'
// import { Server } from 'socket.io';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'

import { build, createTestUserAndToken } from '../helper'

// import { AiClientService } from '@/plugins/services/ai-client';
import { InterviewService } from '@/plugins/services/interview'
import { AiQuestionCategory, QuestionGenerateResponse } from '@/types/ai.types'
import { InterviewRequestBody } from '@/types/interview.types'

// Mock data
const mockInterviewData: InterviewRequestBody = {
  company: { value: 'TestCorp' },
  jobTitle: { value: 'Software Engineer' },
  jobSpec: { value: 'Backend' },
  idealTalent: { value: 'Proactive' },
}

const mockFiles = {
  coverLetter: { buffer: Buffer.from('dummy-cv'), filename: 'cv.pdf' },
  portfolio: {
    buffer: Buffer.from('dummy-portfolio'),
    filename: 'portfolio.pdf',
  },
}

const mockGeneratedQuestions: QuestionGenerateResponse = [
  {
    main_question_id: 'q1',
    category: AiQuestionCategory.TECHNICAL,
    question: 'First question text',
    criteria: [],
    skills: [],
    rationale: '',
    estimated_answer_time_sec: 60,
  },
  {
    main_question_id: 'q2',
    category: AiQuestionCategory.BEHAVIORAL,
    question: 'Second question text',
    criteria: [],
    skills: [],
    rationale: '',
    estimated_answer_time_sec: 60,
  },
]

describe('InterviewService Unit Tests', () => {
  let app: FastifyInstance
  let interviewService: InterviewService
  let testUser: User

  beforeAll(async () => {
    app = await build()
    const { user } = await createTestUserAndToken(app)
    testUser = user
  })

  afterAll(async () => {
    await app.prisma.user.delete({ where: { id: testUser.id } })
    await app.close()
  })

  beforeEach(() => {
    interviewService = new InterviewService(app)

    // Mock all external dependencies
    // eslint-disable-next-line
    vi.spyOn(app.r2, 'send').mockResolvedValue({} as any)
    vi.spyOn(app.aiClientService, 'parsePdf').mockResolvedValue({
      filename: 'parsed.pdf',
      extracted_text: 'parsed text',
    })
    vi.spyOn(app.aiClientService, 'generateQuestions').mockResolvedValue(
      mockGeneratedQuestions,
    )
    vi.spyOn(app.aiClientService, 'logShownQuestion').mockResolvedValue(
      undefined,
    )
    vi.spyOn(app.io, 'to').mockReturnValue({
      emit: vi.fn(),
      // eslint-disable-next-line
    } as any)
    vi.spyOn(app.ttsService, 'generate').mockResolvedValue('fake-base64-string')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializeSession - should create a new session with correct title', async () => {
    let session
    try {
      session = await interviewService.initializeSession(
        testUser.id,
        mockInterviewData,
      )
      expect(session).toBeDefined()
      expect(session.userId).toBe(testUser.id)
      expect(session.company).toBe('TestCorp')
      expect(session.title).toContain('TestCorp')
    } finally {
      if (session) {
        await app.prisma.interviewSession.delete({ where: { id: session.id } })
      }
    }
  })

  it('processInterviewInBackground - should succeed and set status to READY', async () => {
    let session
    try {
      session = await interviewService.initializeSession(
        testUser.id,
        mockInterviewData,
      )
      await interviewService.processInterviewInBackground(
        session.id,
        mockInterviewData,
        mockFiles,
      )

      const updatedSession = await app.prisma.interviewSession.findUnique({
        where: { id: session.id },
      })
      expect(updatedSession?.status).toBe('READY')

      // Verify external calls
      expect(app.r2.send).toHaveBeenCalledTimes(2)
      expect(app.aiClientService.parsePdf).toHaveBeenCalledTimes(2)
      expect(app.aiClientService.generateQuestions).toHaveBeenCalledOnce()
      expect(app.io.to(session.id).emit).toHaveBeenCalledWith(
        'server:questions-ready',
        expect.any(Object),
      )
    } finally {
      if (session) {
        await app.prisma.interviewSession.delete({ where: { id: session.id } })
      }
    }
  })

  it('processInterviewInBackground - should fail and set status to FAILED on AI error', async () => {
    // Override mock to simulate failure
    vi.spyOn(app.aiClientService, 'generateQuestions').mockRejectedValue(
      new Error('AI Failure'),
    )

    let session
    try {
      session = await interviewService.initializeSession(
        testUser.id,
        mockInterviewData,
      )
      await interviewService.processInterviewInBackground(
        session.id,
        mockInterviewData,
        mockFiles,
      )

      const updatedSession = await app.prisma.interviewSession.findUnique({
        where: { id: session.id },
      })
      expect(updatedSession?.status).toBe('FAILED')
      expect(app.io.to(session.id).emit).toHaveBeenCalledWith(
        'server:error',
        expect.any(Object),
      )
    } finally {
      if (session) {
        await app.prisma.interviewSession.delete({ where: { id: session.id } })
      }
    }
  })

  it('saveQuestionsAndNotifyClient - should emit questions-ready with sessionId', async () => {
    let session
    try {
      // Create a real session to satisfy the foreign key constraint
      session = await interviewService.initializeSession(
        testUser.id,
        mockInterviewData,
      )

      await interviewService.saveQuestionsAndNotifyClient(
        session.id,
        mockGeneratedQuestions,
      )

      // Verify server:questions-ready was called with the correct session ID
      expect(app.io.to(session.id).emit).toHaveBeenCalledWith(
        'server:questions-ready',
        {
          answeredSteps: [],
          elapsedSec: 0,
          sessionId: session.id,
        },
      )

      // Verify that TTS is NO LONGER called in this function
      expect(app.ttsService.generate).not.toHaveBeenCalled()
    } finally {
      if (session) {
        await app.prisma.interviewSession.delete({ where: { id: session.id } })
      }
    }
  })
})
