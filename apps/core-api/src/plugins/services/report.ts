import { Prisma } from '@prisma/client'
import { Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import {
  S_ReportItem,
  S_ReportsQueryParams,
  S_ReportsSummaryResponse,
  S_ReportDetailResponse,
  S_ReportQuestionsResponse,
} from '@/schemas/rest'

// TypeBox 스키마에서 타입 추출
type ReportQueryParams = Static<typeof S_ReportsQueryParams>
type ReportItem = Static<typeof S_ReportItem>
type ReportsSummary = Static<typeof S_ReportsSummaryResponse>
type ReportDetailResponse = Static<typeof S_ReportDetailResponse>
type ReportQuestionsResponse = Static<typeof S_ReportQuestionsResponse>

export class ReportService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 페이지별 리포트 목록을 반환합니다 (최대 10개)
   */
  public async getReports(
    userId: string,
    params: ReportQueryParams,
  ): Promise<ReportItem[]> {
    const { prisma } = this.fastify
    const page = params.page || 1
    const pageSize = 10
    const skip = (page - 1) * pageSize

    // Prisma where 조건 구성
    const where = this.buildWhereClause(userId, params)

    // 정렬 조건 구성
    const orderBy = this.buildOrderByClause(params.sort)

    // 완료된 면접 세션 조회
    const sessions = await prisma.interviewSession.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        company: true,
        jobTitle: true,
        jobSpec: true,
        createdAt: true,
        averageScore: true,
        totalTimeSec: true,
      },
    })

    // ReportItem 형식으로 변환
    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      company: session.company,
      jobTitle: session.jobTitle as 'web' | 'app',
      jobSpec: session.jobSpec as 'front' | 'back',
      date: session.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      score: session.averageScore ?? 0,
      duration: session.totalTimeSec
        ? Math.round(session.totalTimeSec / 60)
        : 0,
    }))
  }

  /**
   * 전체 페이지 수를 반환합니다 (10개 단위)
   */
  public async getTotalPages(
    userId: string,
    params: ReportQueryParams,
  ): Promise<number> {
    const { prisma } = this.fastify
    const pageSize = 10

    const where = this.buildWhereClause(userId, params)

    const totalCount = await prisma.interviewSession.count({ where })

    return Math.ceil(totalCount / pageSize)
  }

  /**
   * 전체 리포트의 요약 통계를 반환합니다
   */
  public async getSummary(
    userId: string,
    params: ReportQueryParams,
  ): Promise<ReportsSummary> {
    const { prisma } = this.fastify

    const where = this.buildWhereClause(userId, params)

    // 전체 세션 수
    const totalReports = await prisma.interviewSession.count({ where })

    // 평균 점수 & 평균 소요 시간 (DB 레벨 aggregate 사용)
    const aggregateResult = await prisma.interviewSession.aggregate({
      where,
      _avg: {
        averageScore: true,
        totalTimeSec: true,
      },
    })

    const averageScore = aggregateResult._avg.averageScore
      ? Math.round(aggregateResult._avg.averageScore * 10) / 10
      : 0

    const averageDuration = aggregateResult._avg.totalTimeSec
      ? Math.round(aggregateResult._avg.totalTimeSec / 60)
      : 0

    // 가장 많이 등장한 회사 (DB 레벨 groupBy 사용)
    const companyGroups = await prisma.interviewSession.groupBy({
      by: ['company'],
      where,
      _count: {
        company: true,
      },
      orderBy: {
        _count: {
          company: 'desc',
        },
      },
      take: 1,
    })

    const mostFrequentCompany = companyGroups[0]?.company || 'N/A'

    return {
      totalReports,
      averageScore,
      averageDuration,
      mostFrequentCompany,
    }
  }

  /**
   * 특정 리포트의 상세 정보를 반환합니다
   * @throws {Error} 404 Not Found - 세션이 존재하지 않을 경우
   * @throws {Error} 403 Forbidden - 소유자가 아닐 경우
   * @throws {Error} 400 Bad Request - 세션이 COMPLETED 상태가 아닐 경우
   */
  public async getReportDetail(
    sessionId: string,
    userId: string,
  ): Promise<ReportDetailResponse> {
    const { prisma } = this.fastify

    // 세션 조회 및 권한 확인
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        status: true,
        title: true,
        jobTitle: true,
        jobSpec: true,
        coverLetter: true,
        portfolio: true,
        idealTalent: true,
        averageScore: true,
        totalTimeSec: true,
        finalFeedback: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!session) {
      throw this.fastify.httpErrors.notFound('Report not found.')
    }

    if (session.userId !== userId) {
      throw this.fastify.httpErrors.forbidden(
        'You are not authorized to view this report.',
      )
    }

    if (session.status !== 'COMPLETED') {
      throw this.fastify.httpErrors.badRequest(
        'This interview session is not completed yet.',
      )
    }

    // 메인 질문들 조회 (tailSteps 포함)
    const mainQuestions = await prisma.interviewStep.findMany({
      where: {
        interviewSessionId: sessionId,
        parentStepId: null,
      },
      orderBy: { aiQuestionId: 'asc' },
      include: {
        tailSteps: {
          orderBy: { aiQuestionId: 'asc' },
        },
      },
    })

    // 메트릭 계산
    const scores = mainQuestions.map((mainQ) => {
      const allScores = [
        mainQ.score,
        ...mainQ.tailSteps.map((tail) => tail.score),
      ].filter((s): s is number => s !== null)
      if (allScores.length === 0) return 0
      const sum = allScores.reduce((acc, s) => acc + s, 0)
      return Math.round((sum / allScores.length) * 10) / 10 // 소수점 1자리
    })
    const durations = mainQuestions.map((mainQ) => {
      const mainDuration = mainQ.answerDurationSec ?? 0
      const tailDuration = mainQ.tailSteps.reduce(
        (sum, tail) => sum + (tail.answerDurationSec ?? 0),
        0,
      )
      return Math.round((mainDuration + tailDuration) / 60) // 분 단위
    })
    const counts = mainQuestions.map((q) => q.tailSteps.length + 1) // 메인 + 꼬리 세트
    const totalQuestionCount =
      mainQuestions.length +
      mainQuestions.reduce((sum, q) => sum + q.tailSteps.length, 0)

    return {
      overviewInfo: {
        interviewInfo: {
          title: session.title,
          jobTitle: session.jobTitle,
          jobSpec: session.jobSpec,
          coverLetterFilename: this.extractFilenameFromUrl(
            session.coverLetter ?? '',
          ),
          portfolioFilename: this.extractFilenameFromUrl(
            session.portfolio ?? '',
          ),
          idealTalent: session.idealTalent,
        },
        metricsInfo: {
          score: session.averageScore ?? 0,
          scores,
          duration: session.totalTimeSec
            ? Math.round(session.totalTimeSec / 60)
            : 0,
          durations,
          count: totalQuestionCount,
          counts,
          startDate: session.createdAt.toISOString(),
          finishDate: session.updatedAt.toISOString(),
        },
      },
      feedback: session.finalFeedback ?? '',
    }
  }

  /**
   * 특정 리포트의 질문 상세 정보를 반환합니다
   * @throws {Error} 404 Not Found - 세션이 존재하지 않을 경우
   * @throws {Error} 403 Forbidden - 소유자가 아닐 경우
   * @throws {Error} 400 Bad Request - 세션이 COMPLETED 상태가 아닐 경우
   */
  public async getReportQuestions(
    sessionId: string,
    userId: string,
  ): Promise<ReportQuestionsResponse> {
    const { prisma } = this.fastify

    // 세션 조회 및 권한 확인
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        status: true,
        title: true,
      },
    })

    if (!session) {
      throw this.fastify.httpErrors.notFound('Report not found.')
    }

    if (session.userId !== userId) {
      throw this.fastify.httpErrors.forbidden(
        'You are not authorized to view this report.',
      )
    }

    if (session.status !== 'COMPLETED') {
      throw this.fastify.httpErrors.badRequest(
        'This interview session is not completed yet.',
      )
    }

    const { title } = session

    // 메인 질문들 조회 (tailSteps 포함)
    const mainQuestions = await prisma.interviewStep.findMany({
      where: {
        interviewSessionId: sessionId,
        parentStepId: null,
      },
      orderBy: { aiQuestionId: 'asc' },
      include: {
        tailSteps: {
          orderBy: { aiQuestionId: 'asc' },
        },
      },
    })

    // 응답 형식에 맞게 변환
    const questions = mainQuestions.map((mainQ) => ({
      id: mainQ.id,
      aiQuestionId: mainQ.aiQuestionId,
      type: mainQ.type,
      question: mainQ.question,
      answer: mainQ.answer,
      score: mainQ.score,
      createdAt: mainQ.createdAt.toISOString(),
      updatedAt: mainQ.updatedAt.toISOString(),
      rationale: mainQ.rationale,
      criteria: mainQ.criteria,
      skills: mainQ.skills,
      estimatedAnswerTimeSec: mainQ.estimatedAnswerTimeSec,
      answerDurationSec: mainQ.answerDurationSec,
      answerStartedAt: mainQ.answerStartedAt?.toISOString() ?? null,
      answerEndedAt: mainQ.answerEndedAt?.toISOString() ?? null,
      strengths: mainQ.strengths,
      improvements: mainQ.improvements,
      redFlags: mainQ.redFlags,
      feedback: mainQ.feedback,
      interviewSessionId: mainQ.interviewSessionId,
      parentStepId: mainQ.parentStepId,
      tailSteps: mainQ.tailSteps.map((tailQ) => ({
        id: tailQ.id,
        aiQuestionId: tailQ.aiQuestionId,
        type: tailQ.type,
        question: tailQ.question,
        answer: tailQ.answer,
        score: tailQ.score,
        createdAt: tailQ.createdAt.toISOString(),
        updatedAt: tailQ.updatedAt.toISOString(),
        rationale: tailQ.rationale,
        criteria: tailQ.criteria,
        skills: tailQ.skills,
        estimatedAnswerTimeSec: tailQ.estimatedAnswerTimeSec,
        answerDurationSec: tailQ.answerDurationSec,
        answerStartedAt: tailQ.answerStartedAt?.toISOString() ?? null,
        answerEndedAt: tailQ.answerEndedAt?.toISOString() ?? null,
        strengths: tailQ.strengths,
        improvements: tailQ.improvements,
        redFlags: tailQ.redFlags,
        feedback: tailQ.feedback,
        interviewSessionId: tailQ.interviewSessionId,
        parentStepId: tailQ.parentStepId,
        tailSteps: [], // 꼬리질문의 꼬리질문은 없음
      })),
    }))

    return {
      title,
      questions,
    }
  }

  // --- Helper Methods ---

  /**
   * R2 URL에서 원본 파일명을 추출합니다
   * InterviewService와 동일한 로직
   */
  private extractFilenameFromUrl(url: string): string {
    if (!url) return ''

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
   * Prisma where 절을 구성합니다
   */
  private buildWhereClause(
    userId: string,
    params: ReportQueryParams,
  ): {
    userId: string
    status: 'COMPLETED'
    title?: { contains: string; mode: 'insensitive' }
    company?: { contains: string; mode: 'insensitive' }
    createdAt?: { gte?: Date; lte?: Date }
    jobTitle?: string
    jobSpec?: string
  } {
    const where = {
      userId, // 사용자별 필터링
      status: 'COMPLETED' as const, // 완료된 면접만
    } as {
      userId: string
      status: 'COMPLETED'
      title?: { contains: string; mode: 'insensitive' }
      company?: { contains: string; mode: 'insensitive' }
      createdAt?: { gte?: Date; lte?: Date }
      jobTitle?: string
      jobSpec?: string
    }

    // 제목 검색
    if (params.title) {
      where.title = {
        contains: params.title,
        mode: 'insensitive',
      }
    }

    // 회사명 검색
    if (params.company) {
      where.company = {
        contains: params.company,
        mode: 'insensitive',
      }
    }

    // 날짜 범위 필터
    if (params.from || params.to) {
      where.createdAt = {}
      if (params.from) {
        where.createdAt.gte = new Date(params.from)
      }
      if (params.to) {
        // to 날짜의 끝까지 포함 (23:59:59)
        const toDate = new Date(params.to)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    // 직무 필터
    if (params.job) {
      where.jobTitle = params.job
    }

    // 세부 직무 필터
    if (params.detailJob) {
      where.jobSpec = params.detailJob
    }

    return where
  }

  /**
   * Prisma orderBy 절을 구성합니다
   */
  private buildOrderByClause(
    sort?: string,
  ):
    | Prisma.InterviewSessionOrderByWithRelationInput
    | Prisma.InterviewSessionOrderByWithRelationInput[] {
    if (!sort) {
      // 기본: 최신순
      return { createdAt: 'desc' }
    }

    const [field, order] = sort.split('-')
    const orderDirection = (
      order === 'asc' ? 'asc' : 'desc'
    ) as Prisma.SortOrder

    // date는 createdAt으로 매핑
    if (field === 'date') {
      return { createdAt: orderDirection }
    }

    // job은 jobTitle, jobSpec 순으로 정렬
    if (field === 'job') {
      return [{ jobTitle: orderDirection }, { jobSpec: orderDirection }]
    }

    // score는 averageScore로 정렬
    if (field === 'score') {
      return { averageScore: orderDirection }
    }

    // duration은 totalTimeSec으로 정렬
    if (field === 'duration') {
      return { totalTimeSec: orderDirection }
    }

    // 스키마 필드와 요청 키가 같은 필드는 아래와 같이 정렬
    // 사실 DB 스키마 확인하고 전부 동일하게 요청해주면 이 코드로 다 해결 가능한데
    if (field === 'title' || field === 'company') {
      return { [field]: orderDirection }
    }

    // 유효하지 않은 필드는 기본 정렬
    return { createdAt: 'desc' }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    reportService: ReportService
  }
}

export default fp(
  async (fastify) => {
    const reportService = new ReportService(fastify)
    fastify.decorate('reportService', reportService)
  },
  {
    name: 'reportService',
    dependencies: ['prisma'],
  },
)
