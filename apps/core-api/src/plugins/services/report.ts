import { Prisma } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

interface ReportQueryParams {
  title?: string
  company?: string
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  job?: 'web' | 'app'
  detailJob?: 'front' | 'back'
  page?: number
  sort?: string // "{field}-{asc|desc}"
}

interface ReportItem {
  id: string
  title: string
  company: string
  jobTitle: 'web' | 'app'
  jobSpec: 'front' | 'back'
  date: string // YYYY-MM-DD
  score: number
  duration: number // 분 단위
}

interface ReportsSummary {
  totalReports: number
  averageScore: number
  averageDuration: number
  mostFrequentCompany: string
}

export class ReportService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 페이지별 리포트 목록을 반환합니다 (최대 10개)
   */
  public async getReports(params: ReportQueryParams): Promise<ReportItem[]> {
    const { prisma } = this.fastify
    const page = params.page || 1
    const pageSize = 10
    const skip = (page - 1) * pageSize

    // Prisma where 조건 구성
    const where = this.buildWhereClause(params)

    // 정렬 조건 구성
    const orderBy = this.buildOrderByClause(params.sort)

    // 완료된 면접 세션 조회
    const sessions = await prisma.interviewSession.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        steps: {
          where: {
            score: { not: null }, // 평가된 질문만
          },
          select: {
            score: true,
            answerDurationSec: true,
          },
        },
      },
    })

    // ReportItem 형식으로 변환
    return sessions.map((session) => {
      const scores = session.steps
        .map((step) => step.score)
        .filter((score): score is number => score !== null)

      const averageScore =
        scores.length > 0
          ? Math.round(
              (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10,
            ) / 10
          : 0

      const totalDurationSec = session.steps
        .map((step) => step.answerDurationSec)
        .filter((duration): duration is number => duration !== null)
        .reduce((sum, d) => sum + d, 0)

      const durationMin = Math.round(totalDurationSec / 60)

      return {
        id: session.id,
        title: session.title,
        company: session.company,
        jobTitle: session.jobTitle as 'web' | 'app',
        jobSpec: session.jobSpec as 'front' | 'back',
        date: session.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
        score: averageScore,
        duration: durationMin,
      }
    })
  }

  /**
   * 전체 페이지 수를 반환합니다 (10개 단위)
   */
  public async getTotalPages(params: ReportQueryParams): Promise<number> {
    const { prisma } = this.fastify
    const pageSize = 10

    const where = this.buildWhereClause(params)

    const totalCount = await prisma.interviewSession.count({ where })

    return Math.ceil(totalCount / pageSize)
  }

  /**
   * 전체 리포트의 요약 통계를 반환합니다
   */
  public async getSummary(params: ReportQueryParams): Promise<ReportsSummary> {
    const { prisma } = this.fastify

    const where = this.buildWhereClause(params)

    // 전체 세션 수
    const totalReports = await prisma.interviewSession.count({ where })

    // 평균 점수 및 평균 소요 시간 계산을 위한 데이터 조회
    const sessions = await prisma.interviewSession.findMany({
      where,
      include: {
        steps: {
          where: {
            score: { not: null },
          },
          select: {
            score: true,
            answerDurationSec: true,
          },
        },
      },
    })

    // 평균 점수 계산
    let totalScore = 0
    let scoreCount = 0
    let totalDurationSec = 0

    sessions.forEach((session) => {
      session.steps.forEach((step) => {
        if (step.score !== null) {
          totalScore += step.score
          scoreCount++
        }
        if (step.answerDurationSec !== null) {
          totalDurationSec += step.answerDurationSec
        }
      })
    })

    const averageScore =
      scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0

    const averageDuration =
      sessions.length > 0
        ? Math.round(totalDurationSec / 60 / sessions.length)
        : 0

    // 가장 많이 등장한 회사명 계산
    const companyCount = new Map<string, number>()
    sessions.forEach((session) => {
      const count = companyCount.get(session.company) || 0
      companyCount.set(session.company, count + 1)
    })

    let mostFrequentCompany = ''
    let maxCount = 0
    companyCount.forEach((count, company) => {
      if (count > maxCount) {
        maxCount = count
        mostFrequentCompany = company
      }
    })

    return {
      totalReports,
      averageScore,
      averageDuration,
      mostFrequentCompany: mostFrequentCompany || 'N/A',
    }
  }

  // --- Helper Methods ---

  /**
   * Prisma where 절을 구성합니다
   */
  private buildWhereClause(params: ReportQueryParams): {
    status: 'COMPLETED'
    title?: { contains: string; mode: 'insensitive' }
    company?: { contains: string; mode: 'insensitive' }
    createdAt?: { gte?: Date; lte?: Date }
    jobTitle?: string
    jobSpec?: string
  } {
    const where = {
      status: 'COMPLETED' as const, // 완료된 면접만
    } as {
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
  ): Prisma.InterviewSessionOrderByWithRelationInput {
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

    // score, duration은 복잡한 계산이 필요하므로 기본 정렬 사용
    // (실제로는 애플리케이션 레벨에서 정렬해야 함)
    if (field === 'score' || field === 'duration') {
      // TODO: 애플리케이션 레벨에서 정렬 구현 필요
      return { createdAt: 'desc' }
    }

    // 허용된 필드만 정렬 가능
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
