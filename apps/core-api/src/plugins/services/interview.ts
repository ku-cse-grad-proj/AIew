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

  public async saveQuestionsAndNotifyClient(
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

  /**
   * 사용자의 답변을 처리하고 다음 질문을 반환하거나 면접을 종료합니다.
   * TDD를 위해 우선 Mock 구현으로 시작합니다.
   */
  public async processUserAnswer(
    sessionId: string,
    stepId: string,
    answer: string,
    duration: number,
  ) {
    const { prisma, log } = this.fastify

    log.info(
      `[${sessionId}] Processing answer for step ${stepId}: "${answer.substring(
        0,
        20,
      )}..."`,
    )

    // 답변 내용과 시간을 DB에 업데이트
    await prisma.interviewStep.update({
      where: { id: stepId },
      data: {
        answer: answer,
        answerDurationSec: duration,
      },
    })

    // 현재 세션 정보와 모든 질문 목록을 가져옴
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      throw new Error('Interview session not found')
    }
    const allSteps = session.steps

    // --- AI 연동 로직 (현재는 Mock 처리) ---
    // TODO: aiClientService.evaluateAndGetNextStep() 호출
    const mockAiResponse = {
      evaluation_result: {
        /* ... */
      },
      next_action: 'MAIN', // 항상 다음 메인 질문으로 간다고 가정
      follow_up_question: null,
    }
    // TODO: 평가 결과 DB에 저장
    // --- AI 연동 로직 끝 ---

    const { next_action } = mockAiResponse

    if (next_action === 'FOLLOW_UP') {
      // TODO: 꼬리 질문 처리 로직
    }

    if (next_action === 'MAIN') {
      const mainQuestions = allSteps.filter((s) => !s.parentStepId)

      // 현재가 마지막 메인 질문이었는지 확인
      if (session.currentQuestionIndex >= mainQuestions.length - 1) {
        log.info(
          `[${sessionId}] Last main question answered. Finishing interview.`,
        )
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED' },
        })
        return null // 면접 종료 신호
      }

      // 다음 메인 질문으로 넘기기
      const nextIndex = session.currentQuestionIndex + 1
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { currentQuestionIndex: nextIndex },
      })

      log.info(
        `[${sessionId}] Moving to next main question index: ${nextIndex}`,
      )
      return mainQuestions[nextIndex]
    }

    // 'END' 또는 예외 케이스
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    })
    return null
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
