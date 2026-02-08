import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createId } from '@paralleldrive/cuid2'
import { Static } from '@sinclair/typebox'
import axios, { AxiosResponse } from 'axios'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { AiClientService } from './ai-client'

import {
  InterviewSession,
  InterviewStep,
  QuestionType,
} from '@/generated/prisma/client'
import { S_InterviewSessionPatchBody } from '@/schemas/rest'
import {
  AiInterviewQuestion,
  AiQuestionCategory,
  AnswerEvaluationRequest,
  AnswerEvaluationResult,
  FollowUp,
  FollowupRequest,
  QuestionGenerateResponse,
  TailDecision,
} from '@/types/ai.types'
import { FileActions, InterviewRequestBody } from '@/types/interview.types'

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

    // 제목 생성 로직
    const companyName = interviewData.company.value
    let title, suffix

    // 해당 회사에 대한 기존 세션 수를 기본 접미사로 사용
    const baseCount = await prisma.interviewSession.count({
      where: { userId, company: companyName },
    })
    suffix = baseCount + 1

    // 유니크한 제목을 찾을 때까지 반복
    while (true) {
      const potentialTitle = `${companyName} ${suffix}`
      const existingSession = await prisma.interviewSession.findUnique({
        where: {
          userId_title: {
            userId,
            title: potentialTitle,
          },
        },
      })

      if (!existingSession) {
        title = potentialTitle
        break
      }
      suffix++
    }

    const session = await prisma.interviewSession.create({
      data: {
        id: sessionId,
        userId,
        title,
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
    interviewData:
      | InterviewRequestBody
      | Static<typeof S_InterviewSessionPatchBody>,
    files: {
      coverLetter: FilePayload
      portfolio?: FilePayload
    },
  ) {
    const { prisma, log } = this.fastify
    try {
      log.info(`[${sessionId}] Starting background processing...`)

      const fileUrls = await this.uploadFilesToR2(sessionId, files)
      log.info(`[${sessionId}] Files uploaded successfully.`)

      const parsedTexts = await this.parsePdfFiles(files)
      log.info(`[${sessionId}] PDFs parsed successfully.`)

      // 파일 URL과 파싱된 텍스트를 함께 저장
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          ...fileUrls,
          coverLetterText: parsedTexts.resume_text,
          portfolioText: parsedTexts.portfolio_text,
        },
      })
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

      // 성공 시 상태를 READY로 변경
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'READY' },
      })
    } catch (error) {
      log.error({ error }, `[${sessionId}] Error during background processing`)
      // 실패 시 상태를 FAILED로 변경
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      })
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

      // 상태를 READY로 업데이트하고, 클라이언트에게 준비되었음을 알립니다.
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'READY' },
      })
      log.info(`[${sessionId}] Notifying client that questions are ready.`)
      io.to(sessionId).emit('server:questions-ready', {
        sessionId,
        elapsedSec: 0,
        answeredSteps: [],
      })
    } catch (error) {
      log.error(
        { error },
        `[${sessionId}] Error in saveQuestionsAndNotifyClient`,
      )
      io.to(sessionId).emit('server:error', {
        code: 'QUESTION_PROCESSING_FAILED',
        message: 'Failed to process and save interview questions.',
      })
      // 이 함수에서 에러 발생 시 상위로 throw하여 FAILED 상태로 처리
      throw error
    }
  }

  public async processUserAnswer(
    sessionId: string,
    stepId: string,
    answer: string,
    duration: number,
    startAt: Date,
    endAt: Date,
  ) {
    const { prisma, log, io } = this.fastify
    log.info(`[${sessionId}] Start processing answer for step ${stepId}...`)
    try {
      // 첫 답변 제출 시 IN_PROGRESS로 상태 변경 및 현재 인덱스 가져오기
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        select: { status: true, currentQuestionIndex: true },
      })
      if (!session) {
        throw new Error(`[${sessionId}] Session not found.`)
      }
      if (session?.status === 'READY') {
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'IN_PROGRESS' },
        })
      }

      const currentStep = await prisma.interviewStep.update({
        where: { id: stepId },
        data: {
          answer,
          answerDurationSec: duration,
          answerStartedAt: startAt,
          answerEndedAt: endAt,
        },
      })

      // 질문과 답변을 랭체인 메모리에 추가
      // 꼬리질문인 경우 aiQuestionId에서 부모 ID 추출 (q1-fu1 → q1)
      const parentAiQuestionId = currentStep.parentStepId
        ? currentStep.aiQuestionId.split('-')[0]
        : undefined
      await this.aiClient.logQuestionAsked(
        this.formatStepToQuestionAsked(currentStep, parentAiQuestionId),
        sessionId,
      )

      await this.aiClient.logAnswerReceived(
        {
          aiQuestionId: currentStep.aiQuestionId,
          answer: answer,
          answerDurationSec: duration,
        },
        sessionId,
      )

      const evaluationResult = await this.requestAnswerEvaluation(
        currentStep,
        answer,
        duration,
        sessionId,
      )
      await this.saveEvaluationResult(stepId, evaluationResult)

      if (evaluationResult.tailDecision === TailDecision.CREATE) {
        // 꼬리질문의 '뿌리'가 되는 메인 질문의 ID를 찾음
        const rootQuestionId = currentStep.parentStepId ?? currentStep.id
        const followUpCount = await prisma.interviewStep.count({
          where: {
            interviewSessionId: sessionId,
            parentStepId: rootQuestionId, // 단순하고 효율적인 카운팅
          },
        })

        const MAX_FOLLOWUPS = 3
        if (followUpCount >= MAX_FOLLOWUPS) {
          log.info(
            `[${sessionId}] Max follow-up limit (${MAX_FOLLOWUPS}) reached for question ${currentStep.aiQuestionId}. Moving to next main question.`,
          )
          await this.handleNextMainQuestion(sessionId)
        } else {
          await this.handleFollowupQuestion(
            sessionId,
            currentStep,
            answer,
            evaluationResult,
          )
        }
      } else {
        await this.handleNextMainQuestion(sessionId)
      }
    } catch (error) {
      log.error(
        { error },
        `[${sessionId}] Error processing answer for step ${stepId}`,
      )
      io.to(sessionId).emit('server:error', {
        code: 'ANSWER_PROCESSING_FAILED',
        message: 'Failed to process your answer.',
      })
    }
    log.info(`[${sessionId}] Finished processing answer for step ${stepId}.`)
  }

  /**
   * OpenAI Realtime Transcription을 위한 임시 토큰을 발급합니다.
   * @throws {Error} 403 Forbidden - 소유자가 아닐 경우
   * @throws {Error} 404 Not Found - 세션이 존재하지 않을 경우
   * @throws {Error} 500 Internal Server Error - OpenAI API 통신 실패
   */
  public async generateSttToken(
    sessionId: string,
    userId: string,
  ): Promise<AxiosResponse> {
    const { prisma, log } = this.fastify

    // 세션 소유권 확인
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw this.fastify.httpErrors.notFound(
        `Interview session with ID '${sessionId}' not found.`,
      )
    }

    if (session.userId !== userId) {
      throw this.fastify.httpErrors.forbidden(
        'You are not authorized to access this interview session.',
      )
    }

    //session 설정
    //turn_detection: semantic_vad가 가장 좋은 성능을 보임
    const sessionConfig = {
      session: {
        type: 'transcription',
        audio: {
          input: {
            transcription: {
              model: 'gpt-4o-transcribe',
              language: 'ko',
            },
            turn_detection: {
              type: 'semantic_vad',
            },
          },
        },
      },
    }

    try {
      // 소유권이 확인되면 토큰 발급 진행
      const response = await axios.post<{ data: { value: string } }>(
        'https://api.openai.com/v1/realtime/client_secrets',
        sessionConfig,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )
      return response
    } catch (error) {
      log.error(error, `[${sessionId}] Failed to get STT token from OpenAI.`)
      throw new Error('Failed to generate STT token.')
    }
  }

  /**
   * 특정 사용자의 모든 면접 세션 목록을 조회합니다.
   */
  public async getUserInterviews(userId: string) {
    const { prisma } = this.fastify
    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId,
        NOT: { status: 'COMPLETED' },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // 파일명 추출 로직 추가 (헬퍼 사용)
    return sessions.map((session) => ({
      ...session,
      ...this.getFileNamesFromSession(session),
    }))
  }

  /**
   * ID를 기준으로 특정 면접 세션을 조회합니다.
   * 해당 사용자의 세션이 아니면 null을 반환합니다.
   */
  public async getInterviewSessionById(sessionId: string, userId: string) {
    const { prisma } = this.fastify
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
      },
    })

    return (
      session && {
        ...session,
        ...this.getFileNamesFromSession(session),
      }
    )
  }

  /**
   * 면접 세션 정보를 수정합니다.
   * @throws {Error} 403 Forbidden - 소유자가 아닐 경우
   * @throws {Error} 404 Not Found - 세션이 존재하지 않을 경우
   */
  public async updateInterviewSession(
    sessionId: string,
    userId: string,
    data: Static<typeof S_InterviewSessionPatchBody>,
    files?: {
      coverLetter?: FilePayload
      portfolio?: FilePayload
    },
    fileActions?: FileActions,
  ): Promise<InterviewSession> {
    const { prisma, log } = this.fastify

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw this.fastify.httpErrors.notFound('Interview session not found.')
    }
    if (session.userId !== userId) {
      throw this.fastify.httpErrors.forbidden(
        'You are not authorized to modify this session.',
      )
    }

    // 상태별 수정 정책 적용
    if (session.status === 'PENDING') {
      throw this.fastify.httpErrors.badRequest(
        'Cannot modify an interview that is currently being processed.',
      )
    }

    const isTitleOnlyUpdate = Object.keys(data).length === 1 && 'title' in data
    if (session.status === 'COMPLETED' && !isTitleOnlyUpdate) {
      throw this.fastify.httpErrors.badRequest(
        'Only the title can be updated for a completed interview.',
      )
    }

    // 파일 액션에 따라 재처리 필요 여부 판단
    // coverLetter는 delete 불가 (라우트에서 검증)
    const hasFileChange =
      fileActions?.coverLetter === 'upload' ||
      fileActions?.portfolio === 'upload' ||
      fileActions?.portfolio === 'delete'

    const aiTriggerFields: (keyof Static<
      typeof S_InterviewSessionPatchBody
    >)[] = ['company', 'jobTitle', 'jobSpec', 'idealTalent']
    const hasAiTriggerFieldUpdate = aiTriggerFields.some(
      (field) => field in data,
    )

    const needsReprocessing = hasFileChange || hasAiTriggerFieldUpdate

    if (needsReprocessing) {
      log.info(`[${sessionId}] Re-processing interview due to updated data.`)

      // AI 메모리 초기화 (실패해도 로깅만 하고 계속 진행)
      try {
        await this.aiClient.resetMemory(sessionId)
        log.info(`[${sessionId}] AI memory reset for re-processing.`)
      } catch (error) {
        log.error({ error }, `[${sessionId}] Failed to reset AI memory`)
      }

      // 텍스트 데이터 업데이트 및 상태 PENDING으로 변경
      const updatedSession = await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          ...data,
          status: 'PENDING',
        },
      })

      // 기존 질문 삭제
      await prisma.interviewStep.deleteMany({
        where: { interviewSessionId: sessionId },
      })

      // R2 파일 삭제 처리
      const { fileService } = this.fastify
      const deletePromises: Promise<void>[] = []

      // coverLetter: upload 시에만 기존 파일 삭제 (delete 불가)
      if (fileActions?.coverLetter === 'upload') {
        deletePromises.push(
          fileService.deleteByPrefix(`coverLetter/${sessionId}/`),
        )
      }

      // portfolio: upload 또는 delete 시 기존 파일 삭제
      if (
        fileActions?.portfolio === 'upload' ||
        fileActions?.portfolio === 'delete'
      ) {
        deletePromises.push(
          fileService.deleteByPrefix(`portfolio/${sessionId}/`),
        )
      }

      if (deletePromises.length > 0) {
        try {
          await Promise.all(deletePromises)
          log.info(`[${sessionId}] Old R2 files deleted for file actions.`)
        } catch (error) {
          log.error(
            { error },
            `[${sessionId}] Failed to delete old R2 files, proceeding with processing`,
          )
        }
      }

      // portfolio delete 액션 시 DB에서 portfolio 관련 필드 초기화
      if (fileActions?.portfolio === 'delete') {
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            portfolio: null,
            portfolioText: '',
          },
        })
        log.info(`[${sessionId}] Portfolio fields cleared in DB.`)
      }

      // 백그라운드 재처리 시작
      const fullInterviewData = {
        company: { value: updatedSession.company },
        jobTitle: { value: updatedSession.jobTitle },
        jobSpec: { value: updatedSession.jobSpec },
        idealTalent: { value: updatedSession.idealTalent || '' },
      }

      // AI 재처리에 필요한 파일들을 준비 (새 파일 또는 R2에서 다운로드)
      const filesForProcessing = await this.prepareFilesForReprocessing(
        session,
        files,
        fileActions,
      )

      void this.processInterviewInBackground(
        sessionId,
        fullInterviewData,
        filesForProcessing,
      )

      return updatedSession
    } else {
      // title만 변경하는 경우
      return prisma.interviewSession.update({
        where: { id: sessionId },
        data,
      })
    }
  }

  /**
   * 면접 세션을 삭제합니다.
   * @throws {Error} 403 Forbidden - 소유자가 아닐 경우
   * @throws {Error} 404 Not Found - 세션이 존재하지 않을 경우
   */
  public async deleteInterviewSession(sessionId: string, userId: string) {
    const { prisma, log } = this.fastify
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw this.fastify.httpErrors.notFound('Interview session not found.')
    }
    if (session.userId !== userId) {
      throw this.fastify.httpErrors.forbidden(
        'You are not authorized to delete this session.',
      )
    }

    if (session.status === 'PENDING') {
      throw this.fastify.httpErrors.badRequest(
        'Cannot delete an interview that is currently being processed.',
      )
    }

    // DB에서 삭제하기 전에 AI 메모리를 먼저 정리
    try {
      await this.aiClient.resetMemory(sessionId)
      log.info(`[${sessionId}] AI memory reset successfully before deletion.`)
    } catch (error) {
      log.error(
        { error },
        `[${sessionId}] Failed to reset AI memory before deletion, but proceeding with DB deletion`,
      )
    }

    // R2에서 관련 파일들 삭제
    const { fileService } = this.fastify
    try {
      await Promise.all([
        fileService.deleteByPrefix(`coverLetter/${sessionId}/`),
        fileService.deleteByPrefix(`portfolio/${sessionId}/`),
      ])
      log.info(`[${sessionId}] R2 files deleted successfully.`)
    } catch (error) {
      log.error(
        { error },
        `[${sessionId}] Failed to delete R2 files, but proceeding with DB deletion`,
      )
    }

    return prisma.interviewSession.delete({
      where: { id: sessionId },
    })
  }

  // --- Helper Methods ---

  private async prepareFilesForReprocessing(
    session: InterviewSession,
    newFiles?: {
      coverLetter?: FilePayload
      portfolio?: FilePayload
    },
    fileActions?: FileActions,
  ): Promise<{
    coverLetter: FilePayload
    portfolio?: FilePayload
  }> {
    // coverLetter 처리 (delete 불가, 라우트에서 검증)
    let coverLetter: FilePayload | null = null
    const coverLetterAction = fileActions?.coverLetter ?? 'keep'

    if (coverLetterAction === 'upload' && newFiles?.coverLetter) {
      coverLetter = newFiles.coverLetter
    } else if (coverLetterAction === 'keep') {
      coverLetter = await this.getFileBufferFromR2(session.coverLetter)
    }

    if (!coverLetter) {
      throw this.fastify.httpErrors.badRequest(
        'Cover letter is required for AI re-processing.',
      )
    }

    // portfolio 처리
    let portfolio: FilePayload | undefined = undefined
    const portfolioAction = fileActions?.portfolio ?? 'keep'

    if (portfolioAction === 'upload' && newFiles?.portfolio) {
      portfolio = newFiles.portfolio
    } else if (portfolioAction === 'keep') {
      const existingPortfolio = await this.getFileBufferFromR2(
        session.portfolio,
      )
      portfolio = existingPortfolio ?? undefined
    }
    // portfolioAction === 'delete'인 경우 portfolio는 undefined 유지

    return { coverLetter, portfolio }
  }

  private async getFileBufferFromR2(
    fileUrl: string | null,
  ): Promise<FilePayload | null> {
    if (!fileUrl) return null
    const { r2 } = this.fastify
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env

    // R2_PUBLIC_URL 이후의 경로 전체를 fileKey로 추출
    // 새 형식: https://r2.example.com/coverLetter/abc123/file.pdf → coverLetter/abc123/file.pdf
    // 기존 형식: https://r2.example.com/abc123-coverLetter-file.pdf → abc123-coverLetter-file.pdf
    const fileKey = fileUrl.replace(`${R2_PUBLIC_URL}/`, '')

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      })
      const response = await r2.send(command)
      const buffer = Buffer.from(
        (await response.Body?.transformToByteArray()) || [],
      )
      const filename = this.extractFilenameFromUrl(fileUrl)
      return { buffer, filename }
    } catch (error) {
      this.fastify.log.error(error, `Failed to fetch file from R2: ${fileKey}`)
      // 파일을 가져오지 못하면 재처리 불가하므로 null 반환
      return null
    }
  }

  /**
   * R2 URL에서 Prefix를 제거하고 원본 파일명을 추출합니다.
   * 새 형식: "key/sessionId/my_cover_letter.pdf" -> "my_cover_letter.pdf"
   * 기존 형식: "sessionId-coverLetter-my_cover_letter.pdf" -> "my_cover_letter.pdf"
   */
  private extractFilenameFromUrl(url: string): string {
    const parts = url.split('/')

    // 새 형식 확인: 끝에서 3번째 part가 'coverLetter' 또는 'portfolio'인지 확인
    if (parts.length >= 3) {
      const thirdLast = parts[parts.length - 3]
      if (thirdLast === 'coverLetter' || thirdLast === 'portfolio') {
        // 새 형식: key/sessionId/filename
        return parts[parts.length - 1]
      }
    }

    // 기존 형식: sessionId-key-filename
    const filenameWithPrefix = parts[parts.length - 1]
    return filenameWithPrefix.split('-').slice(2).join('-')
  }

  /**
   * 세션 객체에서 원본 파일명을 추출해 반환합니다.
   */
  private getFileNamesFromSession(session?: {
    coverLetter: string | null
    portfolio: string | null
  }) {
    const coverLetterFilename = session?.coverLetter
      ? this.extractFilenameFromUrl(session.coverLetter)
      : undefined
    const portfolioFilename = session?.portfolio
      ? this.extractFilenameFromUrl(session.portfolio)
      : undefined

    return { coverLetterFilename, portfolioFilename }
  }

  private async uploadFilesToR2(
    sessionId: string,
    files: { coverLetter: FilePayload; portfolio?: FilePayload },
  ) {
    const { r2 } = this.fastify
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env
    const uploadPromises = Object.entries(files).map(async ([key, file]) => {
      if (!file) return null // 파일이 제공되지 않은 경우 건너뜀
      const fileKey = `${key}/${sessionId}/${file.filename}`
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
    const fileUrlResults = (await Promise.all(uploadPromises)).filter(
      (r): r is { key: 'coverLetter' | 'portfolio'; url: string } => r !== null,
    )
    return fileUrlResults.reduce(
      (acc, { key, url }) => {
        acc[key] = url
        return acc
      },
      {} as { coverLetter?: string; portfolio?: string },
    )
  }

  private async parsePdfFiles(files: {
    coverLetter: FilePayload
    portfolio?: FilePayload
  }) {
    if (files.portfolio) {
      const [coverLetterParsed, portfolioParsed] = await Promise.all([
        this.aiClient.parsePdf(
          files.coverLetter.buffer,
          files.coverLetter.filename,
        ),
        this.aiClient.parsePdf(
          files.portfolio.buffer,
          files.portfolio.filename,
        ),
      ])
      return {
        resume_text: coverLetterParsed.extracted_text,
        portfolio_text: portfolioParsed.extracted_text,
      }
    }

    const coverLetterParsed = await this.aiClient.parsePdf(
      files.coverLetter.buffer,
      files.coverLetter.filename,
    )
    return {
      resume_text: coverLetterParsed.extracted_text,
      portfolio_text: '',
    }
  }

  private prepareQuestionRequest(
    interviewData:
      | InterviewRequestBody
      | Static<typeof S_InterviewSessionPatchBody>,
    parsedTexts: { resume_text: string; portfolio_text: string },
  ) {
    // POST 요청 (InterviewRequestBody)과 PATCH 요청 (S_InterviewSessionPatchBody)의 데이터 구조가 다르므로 분기 처리
    const isPostRequest = (data: unknown): data is InterviewRequestBody =>
      typeof data === 'object' &&
      data !== null &&
      'company' in data &&
      typeof (data as { company: unknown }).company === 'object' &&
      (data as { company: unknown }).company !== null &&
      'value' in ((data as { company: unknown }).company as { value: unknown })

    let company: string, jobTitle: string, idealTalent: string | undefined

    if (isPostRequest(interviewData)) {
      company = interviewData.company.value
      jobTitle = interviewData.jobTitle.value
      idealTalent = interviewData.idealTalent.value
    } else {
      // PATCH 요청의 경우, 데이터가 optional string이므로 타입 캐스팅
      company = interviewData.company as string
      jobTitle = interviewData.jobTitle as string
      idealTalent = interviewData.idealTalent as string
    }

    return {
      user_info: {
        ...parsedTexts,
        company,
        desired_role: jobTitle,
        core_values: idealTalent,
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

  /**
   * InterviewStep을 QuestionAskedRequest 형식으로 변환합니다.
   * @param step - 변환할 InterviewStep
   * @param parentQuestionId - 꼬리질문인 경우 부모 질문 ID
   */
  public formatStepToQuestionAsked(
    step: InterviewStep,
    parentQuestionId?: string,
  ) {
    const {
      aiQuestionId,
      question,
      type,
      criteria,
      skills,
      rationale,
      estimatedAnswerTimeSec,
    } = step
    return {
      aiQuestionId,
      question,
      type,
      criteria,
      skills,
      rationale,
      estimatedAnswerTimeSec,
      parentQuestionId: parentQuestionId ?? null,
    }
  }

  private async requestAnswerEvaluation(
    step: InterviewStep,
    answer: string,
    answerDurationSec: number,
    sessionId: string,
  ) {
    const { aiQuestionId, type, criteria, skills, question } = step
    const request = {
      aiQuestionId,
      type,
      criteria,
      skills,
      question,
      answer,
      answerDurationSec,
    } satisfies AnswerEvaluationRequest
    return this.aiClient.evaluateAnswer(request, sessionId)
  }

  private async saveEvaluationResult(
    stepId: string,
    result: AnswerEvaluationResult,
  ) {
    const { prisma } = this.fastify
    return prisma.interviewStep.update({
      where: { id: stepId },
      data: {
        score: result.overallScore,
        strengths: result.strengths,
        improvements: result.improvements,
        redFlags: result.redFlags,
        feedback: result.feedback,
        criterionEvaluations: {
          createMany: { data: result.criterionScores },
        },
      },
    })
  }

  private async handleFollowupQuestion(
    sessionId: string,
    parentStep: InterviewStep,
    answer: string,
    evaluation: AnswerEvaluationResult,
  ) {
    const { prisma, log, io, ttsService } = this.fastify

    // 꼬리질문의 '뿌리'가 되는 메인 질문을 찾음
    const rootQuestionStep = parentStep.parentStepId
      ? await prisma.interviewStep.findUnique({
          where: { id: parentStep.parentStepId },
        })
      : parentStep

    if (!rootQuestionStep) {
      throw new Error(
        `[${sessionId}] Could not find the root question for step ${parentStep.id}`,
      )
    }

    log.info(`[${sessionId}] Generating follow-up question...`)
    const { type, question, criteria, skills } = parentStep
    const request = {
      aiQuestionId: rootQuestionStep.aiQuestionId, // 항상 메인 질문의 ID를 사용
      type,
      question,
      criteria,
      skills,
      answer,
      evaluationSummary: `Strengths: ${evaluation.strengths.join(', ')}, Improvements: ${evaluation.improvements.join(', ')}`,
    } satisfies FollowupRequest
    const followupResult: FollowUp =
      await this.aiClient.generateFollowUpQuestion(request, sessionId)

    const newFollowupStep = await prisma.interviewStep.create({
      data: {
        interviewSessionId: sessionId,
        parentStepId: rootQuestionStep.id, // parentStepId는 항상 메인 질문의 CUID를 가리킴
        aiQuestionId: followupResult.followupId,
        type: parentStep.type,
        question: followupResult.question,
        criteria: followupResult.focusCriteria,
        skills: parentStep.skills,
        rationale: followupResult.rationale,
        estimatedAnswerTimeSec: followupResult.expectedAnswerTimeSec,
      },
    })

    await this.aiClient.logQuestionAsked(
      this.formatStepToQuestionAsked(
        newFollowupStep,
        rootQuestionStep.aiQuestionId,
      ),
      sessionId,
    )
    log.info(`[${sessionId}] Next question logged to AI memory.`)

    // STT 토큰 및 오디오 생성
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })
    if (!session) {
      throw new Error(`[${sessionId}] Session not found to generate STT token.`)
    }
    const sttToken = await this.generateSttToken(sessionId, session.userId)
    console.time('tts')
    const audioBase64 = await ttsService.generate(newFollowupStep.question)
    console.timeEnd('tts')

    io.to(sessionId).emit('server:next-question', {
      step: newFollowupStep,
      isFollowUp: true,
      audioBase64,
      sttToken: sttToken.data.value,
    })
  }

  private async handleNextMainQuestion(sessionId: string) {
    const { prisma, log, io, ttsService } = this.fastify
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { currentQuestionIndex: true, userId: true },
    })
    if (!session) throw new Error(`Session not found for id: ${sessionId}`)

    const nextIndex = session.currentQuestionIndex + 1

    const mainQuestions = await prisma.interviewStep.findMany({
      where: { interviewSessionId: sessionId, parentStepId: null },
      orderBy: { aiQuestionId: 'asc' },
    })

    if (nextIndex >= mainQuestions.length) {
      log.info(
        `[${sessionId}] Last main question answered. Finishing interview.`,
      )
      // 클라이언트에게 먼저 면접 종료를 알림
      io.to(sessionId).emit('server:interview-finished', { sessionId })

      // 백그라운드에서 세션 평가 및 DB 업데이트 진행
      try {
        const sessionEvaluation = await this.aiClient.evaluateSession(sessionId)

        // 평균 점수 계산 (DB 레벨 aggregate 사용)
        const result = await prisma.interviewStep.aggregate({
          where: {
            interviewSessionId: sessionId,
            score: { not: null },
          },
          _avg: {
            score: true,
          },
        })

        const averageScore = result._avg.score
          ? Math.round(result._avg.score * 10) / 10
          : null

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            finalFeedback: sessionEvaluation.sessionFeedback,
            averageScore,
          },
        })
        log.info(`[${sessionId}] Session evaluation saved successfully.`)

        // 최종 평가 후 메모리 초기화
        try {
          await this.aiClient.resetMemory(sessionId)
          log.info(`[${sessionId}] AI memory reset successfully.`)
        } catch (memError) {
          log.error({ memError }, `[${sessionId}] Failed to reset AI memory`)
        }
      } catch (error) {
        log.error({ error }, `[${sessionId}] Error during session evaluation`)
        // 실패하더라도 세션 상태는 COMPLETED로 유지하되, 에러 로깅
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            finalFeedback: 'Error: Failed to generate session feedback.',
          },
        })
      }
      // 프론트에 세션 평가가 종료되었음을 알림
      io.to(sessionId).emit('server:evaluation-finished', { sessionId })
    } else {
      log.info(
        `[${sessionId}] Moving to next main question index: ${nextIndex}`,
      )
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { currentQuestionIndex: nextIndex },
      })
      const nextStep = mainQuestions[nextIndex]
      await this.aiClient.logQuestionAsked(
        this.formatStepToQuestionAsked(nextStep),
        sessionId,
      )
      log.info(`[${sessionId}] Next question logged to AI memory.`)

      // STT 토큰 및 오디오 생성
      const sttToken = await this.generateSttToken(sessionId, session.userId)
      console.time('tts')
      const audioBase64 = await ttsService.generate(nextStep.question)
      console.timeEnd('tts')

      io.to(sessionId).emit('server:next-question', {
        step: nextStep,
        isFollowUp: false,
        audioBase64,
        sttToken: sttToken.data.value,
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
    dependencies: [
      'aiClientService',
      'fileService',
      'prisma',
      'r2',
      'ttsService',
    ],
  },
)
