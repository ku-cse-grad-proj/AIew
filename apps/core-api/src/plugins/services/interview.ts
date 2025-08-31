import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createId } from '@paralleldrive/cuid2'
import { InterviewStep, QuestionType } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { AiClientService } from './ai-client'

import {
  AiInterviewQuestion,
  AiQuestionCategory,
  AnswerEvaluationRequest,
  EvaluationResult,
  FollowUp,
  FollowupRequest,
  QuestionGenerateResponse,
  TailDecision,
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
   * 면접 세션을 초기화하고 즉시 session을 반환합니다.
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
    const { prisma, log } = this.fastify
    try {
      log.info(`[${sessionId}] Starting background processing...`)
      const fileUrls = await this.uploadFilesToR2(sessionId, files)
      log.info(`[${sessionId}] Files uploaded successfully.`)
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: fileUrls,
      })
      const parsedTexts = await this.parsePdfFiles(sessionId, files)
      log.info(`[${sessionId}] PDFs parsed successfully.`)
      const questionRequestData = this.prepareQuestionRequest(
        interviewData,
        parsedTexts,
      )
      const generatedQuestions = await this.aiClient.generateQuestions(
        questionRequestData,
        sessionId,
      )
      log.info(`[${sessionId}] Questions generated successfully.`)
      await this.saveQuestionsAndNotifyClient(sessionId, generatedQuestions)
    } catch (error) {
      log.error(`[${sessionId}] Error during background processing:`, { error })
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
      const stepsToCreate = questions.map(this.formatQuestionToStep)
      if (stepsToCreate.length > 0) {
        await prisma.interviewStep.createMany({
          data: stepsToCreate.map((step) => ({
            ...step,
            interviewSessionId: sessionId,
          })),
        })
      }
      log.info(`[${sessionId}] Questions saved successfully.`)
      const createdSteps = await prisma.interviewStep.findMany({
        where: { interviewSessionId: sessionId },
        orderBy: { createdAt: 'asc' },
      })
      const firstQuestion = createdSteps[0]
      await this.aiClient.logShownQuestion(
        { question: this.formatStepToAiQuestion(firstQuestion) },
        sessionId,
      )
      log.info(`[${sessionId}] Logged first question to AI memory.`)
      log.info(`[${sessionId}] Notifying client via WebSocket...`)
      io.to(sessionId).emit('server:questions-ready', { steps: createdSteps })
    } catch (error) {
      log.error(`[${sessionId}] Error in saveQuestionsAndNotifyClient:`, {
        error,
      })
      io.to(sessionId).emit('server:error', {
        code: 'QUESTION_PROCESSING_FAILED',
        message: 'Failed to process and save interview questions.',
      })
    }
  }

  public async processUserAnswer(
    sessionId: string,
    stepId: string,
    answer: string,
    duration: number,
  ) {
    const { prisma, log, io } = this.fastify
    log.info(`[${sessionId}] Start processing answer for step ${stepId}...`)
    try {
      const currentStep = await prisma.interviewStep.update({
        where: { id: stepId },
        data: { answer, answerDurationSec: duration },
      })
      await this.aiClient.logUserAnswer(
        {
          question_id: currentStep.aiQuestionId,
          answer: answer,
          answer_duration_sec: duration,
        },
        sessionId,
      )
      const evaluationResult = await this.requestEvaluation(
        currentStep,
        answer,
        duration,
        sessionId,
      )
      await this.saveEvaluationResult(stepId, evaluationResult)
      if (evaluationResult.tail_decision === TailDecision.CREATE) {
        await this.handleFollowupQuestion(
          sessionId,
          currentStep,
          answer,
          evaluationResult,
        )
      } else {
        await this.handleNextMainQuestion(sessionId)
      }
    } catch (error) {
      log.error(`[${sessionId}] Error processing answer for step ${stepId}:`, {
        error,
      })
      io.to(sessionId).emit('server:error', {
        code: 'ANSWER_PROCESSING_FAILED',
        message: 'Failed to process your answer.',
      })
    }
    log.info(`[${sessionId}] Finished processing answer for step ${stepId}.`)
  }

  // --- Helper Methods ---
  private async uploadFilesToR2(
    sessionId: string,
    files: { coverLetter: FilePayload; portfolio: FilePayload },
  ) {
    const { r2 } = this.fastify
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env
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
    return fileUrlResults.reduce(
      (acc, { key, url }) => {
        acc[key] = url
        return acc
      },
      {} as { coverLetter?: string; portfolio?: string },
    )
  }

  private async parsePdfFiles(
    sessionId: string,
    files: { coverLetter: FilePayload; portfolio: FilePayload },
  ) {
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
    return {
      resume_text: coverLetterParsed.extracted_text,
      portfolio_text: portfolioParsed.extracted_text,
    }
  }

  private prepareQuestionRequest(
    interviewData: InterviewRequestBody,
    parsedTexts: { resume_text: string; portfolio_text: string },
  ) {
    return {
      user_info: {
        ...parsedTexts,
        company: interviewData.company.value,
        desired_role: interviewData.jobTitle.value,
        core_values: interviewData.idealTalent.value,
      },
    }
  }

  private formatQuestionToStep(q: AiInterviewQuestion) {
    const typeMapping: Record<AiQuestionCategory, QuestionType> = {
      [AiQuestionCategory.TECHNICAL]: QuestionType.TECHNICAL,
      [AiQuestionCategory.BEHAVIORAL]: QuestionType.PERSONALITY,
      [AiQuestionCategory.TAILORED]: QuestionType.TAILORED,
    }
    return {
      aiQuestionId: q.main_question_id,
      type: typeMapping[q.category],
      question: q.question,
      criteria: q.criteria,
      skills: q.skills,
      rationale: q.rationale,
      estimatedAnswerTimeSec: q.estimated_answer_time_sec,
    }
  }

  private formatStepToAiQuestion(step: InterviewStep) {
    return {
      main_question_id: step.aiQuestionId,
      category: step.type,
      question_text: step.question,
      criteria: step.criteria,
      skills: step.skills,
      rationale: step.rationale,
      estimated_answer_time_sec: step.estimatedAnswerTimeSec,
    }
  }

  private async requestEvaluation(
    step: InterviewStep,
    answer: string,
    duration: number,
    sessionId: string,
  ) {
    const request: AnswerEvaluationRequest = {
      question_id: step.aiQuestionId,
      category: step.type,
      criteria: step.criteria,
      skills: step.skills,
      question_text: step.question,
      user_answer: answer,
      answer_duration_sec: duration,
    }
    return this.aiClient.evaluateAnswer(request, sessionId)
  }

  private async saveEvaluationResult(stepId: string, result: EvaluationResult) {
    const { prisma } = this.fastify
    return prisma.interviewStep.update({
      where: { id: stepId },
      data: {
        score: result.overall_score,
        strengths: result.strengths,
        improvements: result.improvements,
        redFlags: result.red_flags,
        criterionEvaluations: {
          createMany: {
            data: result.criterion_scores.map((c) => ({
              name: c.name,
              score: c.score,
              reason: c.reason,
            })),
          },
        },
      },
    })
  }

  private async handleFollowupQuestion(
    sessionId: string,
    parentStep: InterviewStep,
    answer: string,
    evaluation: EvaluationResult,
  ) {
    const { prisma, log, io } = this.fastify
    log.info(`[${sessionId}] Generating follow-up question...`)
    const followupRequest: FollowupRequest = {
      question_id: parentStep.aiQuestionId,
      category: parentStep.type,
      question_text: parentStep.question,
      criteria: parentStep.criteria,
      skills: parentStep.skills,
      user_answer: answer,
      evaluation_summary: `Strengths: ${evaluation.strengths.join(
        ', ',
      )}, Improvements: ${evaluation.improvements.join(', ')}`,
    }
    const followupResult: FollowUp =
      await this.aiClient.generateFollowUpQuestion(followupRequest, sessionId)
    const createdFollowup = await prisma.interviewStep.create({
      data: {
        interviewSessionId: sessionId,
        parentStepId: parentStep.id,
        aiQuestionId: followupResult.followup_id,
        type: parentStep.type,
        question: followupResult.question,
        criteria: followupResult.focus_criteria,
        skills: parentStep.skills,
        rationale: followupResult.rationale,
        estimatedAnswerTimeSec: followupResult.expected_answer_time_sec,
      },
    })

    const newFollowupStep = await prisma.interviewStep.findUnique({
      where: { id: createdFollowup.id },
    })

    if (!newFollowupStep) {
      throw new Error('Failed to fetch newly created followup step.')
    }

    await this.aiClient.logShownQuestion(
      { question: this.formatStepToAiQuestion(newFollowupStep) },
      sessionId,
    )
    log.info(`[${sessionId}] Next question logged to AI memory.`)
    io.to(sessionId).emit('server:next-question', {
      step: newFollowupStep,
      isFollowUp: true,
    })
  }

  private async handleNextMainQuestion(sessionId: string) {
    const { prisma, log, io } = this.fastify
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        steps: { where: { parentStepId: null }, orderBy: { createdAt: 'asc' } },
      },
    })
    if (!session) throw new Error(`Session not found for id: ${sessionId}`)
    const mainQuestions = session.steps
    const nextIndex = session.currentQuestionIndex + 1
    if (nextIndex >= mainQuestions.length) {
      log.info(
        `[${sessionId}] Last main question answered. Finishing interview.`,
      )
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      })
      io.to(sessionId).emit('server:interview-finished', { sessionId })
    } else {
      log.info(
        `[${sessionId}] Moving to next main question index: ${nextIndex}`,
      )
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { currentQuestionIndex: nextIndex },
      })
      const nextStep = mainQuestions[nextIndex]
      await this.aiClient.logShownQuestion(
        { question: this.formatStepToAiQuestion(nextStep) },
        sessionId,
      )
      log.info(`[${sessionId}] Next question logged to AI memory.`)
      io.to(sessionId).emit('server:next-question', {
        step: nextStep,
        isFollowUp: false,
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
    dependencies: ['aiClientService', 'prisma', 'r2'],
  },
)
