import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createId } from '@paralleldrive/cuid2'
import { QuestionType } from '@prisma/client'
import { FastifyInstance } from 'fastify'

import { AiClientService } from './aiClient.service'

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
  private aiClient: AiClientService

  constructor(private fastify: FastifyInstance) {
    this.aiClient = new AiClientService()
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
        // 파일 URL은 백그라운드 작업에서 업데이트됩니다.
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

      // 1. R2에 파일 업로드 및 URL 생성 (병렬 처리)
      log.info(`[${sessionId}] Uploading files to R2...`)
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

      // 2. DB에 파일 URL 업데이트
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          coverLetter: fileUrls.coverLetter,
          portfolio: fileUrls.portfolio,
        },
      })

      // 3. PDF 파싱 (병렬 처리)
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

      // 4. 질문 생성 요청
      log.info(`[${sessionId}] Generating questions...`)
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

      // 5. 생성된 질문들을 DB에 저장하고 클라이언트에게 알림
      await this.saveQuestionsAndNotifyClient(sessionId, generatedQuestions)
    } catch (error) {
      log.error(`[${sessionId}] Error during background processing: ${error}`)
      // 에러 발생 시 클라이언트에게도 알림
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

      // AI 서버의 질문 카테고리를 Prisma의 Enum 타입으로 매핑
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
