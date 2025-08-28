import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createId } from '@paralleldrive/cuid2'
import { QuestionType } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { AiClientService } from './ai-client'

import {
  AiInterviewQuestion,
  AiQuestionCategory,
  QuestionGenerateResponse,
} from '@/types/ai.types'
import { InterviewRequestBody } from '@/types/interview.types'

interface FilePayload {
  buffer: Buffer
  filename: string
}

export class InterviewService {
  // 의존성 주입을 위해 fastify 인스턴스와 aiClientService를 멤버로 가짐
  private fastify: FastifyInstance
  private aiClient: AiClientService

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
    // new로 생성하는 대신, decorate된 aiClientService를 사용
    this.aiClient = this.fastify.aiClientService
  }

  /**
   * 면접 세션을 초기화하고 즉시 sessionId를 반환합니다.
   */
  public async initializeSession(
    userId: string,
    interviewData: InterviewRequestBody,
  ) {
    const { prisma, log } = this.fastify
    const sessionId = createId()

    log.info(`[${sessionId}] Initializing interview session...`)

    const session = await prisma.interviewSession.create({
      data: {
        id: sessionId,
        userId,
        company: interviewData.company.value,
        jobTitle: interviewData.jobTitle.value,
        jobSpec: interviewData.jobSpec.value,
        idealTalent: interviewData.idealTalent.value,
      },
    })

    log.info(`[${sessionId}] Interview session initialized.`)
    return session
  }

  /**
   * 백그라운드에서 파일 처리, AI 연동, 질문 저장을 수행합니다.
   */
  public async processInterviewInBackground(
    sessionId: string,
    interviewData: InterviewRequestBody,
    files: {
      coverLetter: FilePayload
      portfolio: FilePayload
    },
  ) {
    const { prisma, log, r2 } = this.fastify
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env

    try {
      log.info(`[${sessionId}] Starting background processing...`)

      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        const fileKey = `${sessionId}-${key}-${file.filename}`
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: 'application/pdf',
          }),
        )
        return {
          key: key as 'coverLetter' | 'portfolio',
          url: `${R2_PUBLIC_URL}/${fileKey}`,
        }
      })
      const fileUrlResults = await Promise.all(uploadPromises)
      const fileUrls = fileUrlResults.reduce(
        (acc, { key, url }) => {
          acc[key] = url
          return acc
        },
        {} as { coverLetter?: string; portfolio?: string },
      )
      log.info(`[${sessionId}] Files uploaded successfully.`)

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          coverLetter: fileUrls.coverLetter,
          portfolio: fileUrls.portfolio,
        },
      })

      log.info(`[${sessionId}] Parsing PDFs...`)
      const [coverLetterParsed, portfolioParsed] = await Promise.all([
        this.aiClient.parsePdf(
          files.coverLetter.buffer,
          files.coverLetter.filename,
          sessionId,
        ),
        this.aiClient.parsePdf(
          files.portfolio.buffer,
          files.portfolio.filename,
          sessionId,
        ),
      ])
      log.info(`[${sessionId}] PDFs parsed successfully.`)

      const questionRequestData = {
        user_info: {
          resume_text: coverLetterParsed.extracted_text,
          portfolio_text: portfolioParsed.extracted_text,
          company: interviewData.company.value,
          desired_role: interviewData.jobTitle.value,
          core_values: interviewData.idealTalent.value,
        },
      }
      const generatedQuestions = await this.aiClient.generateQuestions(
        questionRequestData,
        sessionId,
      )
      log.info(`[${sessionId}] Questions generated successfully.`)

      await this.saveQuestionsAndNotifyClient(sessionId, generatedQuestions)
    } catch (error) {
      log.error(`[${sessionId}] Error during background processing: ${error}`)
      this.fastify.io.to(sessionId).emit('server:error', {
        code: 'INTERVIEW_SETUP_FAILED',
        message: 'Failed to set up the interview. Please try again.',
      })
    }
  }

  private async saveQuestionsAndNotifyClient(
    sessionId: string,
    questions: QuestionGenerateResponse,
  ) {
    const { prisma, log, io } = this.fastify
    try {
      log.info(`[${sessionId}] Formatting and saving questions to DB...`)

      const typeMapping: Record<AiQuestionCategory, QuestionType> = {
        [AiQuestionCategory.TECHNICAL]: QuestionType.TECHNICAL,
        [AiQuestionCategory.BEHAVIORAL]: QuestionType.PERSONALITY,
        [AiQuestionCategory.TAILORED]: QuestionType.TAILORED,
      }

      const stepsToCreate = questions.map((q: AiInterviewQuestion) => ({
        interviewSessionId: sessionId,
        type: typeMapping[q.category],
        question: q.question,
        criteria: q.criteria,
        skills: q.skills,
        rationale: q.rationale,
      }))

      if (stepsToCreate.length > 0) {
        await prisma.interviewStep.createMany({
          data: stepsToCreate,
        })
      }
      log.info(`[${sessionId}] Questions saved successfully.`)

      const createdSteps = await prisma.interviewStep.findMany({
        where: { interviewSessionId: sessionId },
        orderBy: { createdAt: 'asc' },
      })

      log.info(`[${sessionId}] Notifying client via WebSocket...`)
      io.to(sessionId).emit('server:questions-ready', { steps: createdSteps })
    } catch (error) {
      log.error(
        `[${sessionId}] Error in saveQuestionsAndNotifyClient: ${error}`,
      )
      io.to(sessionId).emit('server:error', {
        code: 'QUESTION_PROCESSING_FAILED',
        message: 'Failed to process and save interview questions.',
      })
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    interviewService: InterviewService
  }
}

export default fp(
  async (fastify) => {
    const interviewService = new InterviewService(fastify)
    fastify.decorate('interviewService', interviewService)
  },
  {
    name: 'interviewService',
    dependencies: ['aiClientService', 'prisma', 'r2', 'io'],
  },
)
