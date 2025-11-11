import { Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import {
  S_DashboardResponse,
  S_DashboardLineGraphResponse,
  S_DashboardCompanyGraphResponse,
} from '@/schemas/rest'

// TypeBox 스키마에서 타입 추출
type DashboardResponse = Static<typeof S_DashboardResponse>
type DashboardUserInfos = DashboardResponse['userInfos']
type DashboardInterview = DashboardResponse['interview']
type DashboardReportItem = DashboardResponse['reports'][number]
type LineGraphResponse = Static<typeof S_DashboardLineGraphResponse>
type CompanyGraphResponse = Static<typeof S_DashboardCompanyGraphResponse>

export class DashboardService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 메인 대시보드 데이터 조회
   */
  public async getDashboard(userId: string): Promise<DashboardResponse> {
    const [userInfos, interview, reports] = await Promise.all([
      this.getUserInfos(userId),
      this.getRecentInterview(userId),
      this.getRecentReports(userId, 2),
    ])

    return {
      userInfos,
      interview,
      reports,
    }
  }

  /**
   * 라인 그래프 데이터 조회 (최근 10개 완료된 인터뷰)
   */
  public async getLineGraphData(userId: string): Promise<LineGraphResponse> {
    const { prisma } = this.fastify

    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        averageScore: { not: null },
        totalTimeSec: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        title: true,
        averageScore: true,
        totalTimeSec: true,
      },
    })

    // 최신순으로 가져왔으므로 역순으로 정렬 (오래된 것 -> 최신)
    const reversed = sessions.reverse()

    return {
      labels: reversed.map((s) => s.title),
      scores: reversed.map((s) => s.averageScore ?? 0),
      durations: reversed.map((s) =>
        s.totalTimeSec ? Math.round(s.totalTimeSec / 60) : 0,
      ),
    }
  }

  /**
   * 회사별 그래프 데이터 조회 (상위 N개 + Others)
   */
  public async getCompanyGraphData(
    userId: string,
    limit: number = 6,
  ): Promise<CompanyGraphResponse> {
    const { prisma } = this.fastify

    // 회사별 인터뷰 횟수 집계
    const companyGroups = await prisma.interviewSession.groupBy({
      by: ['company'],
      where: {
        userId,
      },
      _count: {
        company: true,
      },
      orderBy: {
        _count: {
          company: 'desc',
        },
      },
    })

    // 상위 N-1개와 나머지를 Others로 집계
    if (companyGroups.length <= limit) {
      // N개 이하면 그대로 반환
      return {
        labels: companyGroups.map((g) => g.company),
        counts: companyGroups.map((g) => g._count.company),
      }
    }

    // 상위 N-1개
    const topCompanies = companyGroups.slice(0, limit - 1)
    const othersCompanies = companyGroups.slice(limit - 1)

    // Others 합산
    const othersCount = othersCompanies.reduce(
      (sum, g) => sum + g._count.company,
      0,
    )

    return {
      labels: [...topCompanies.map((g) => g.company), 'Others'],
      counts: [...topCompanies.map((g) => g._count.company), othersCount],
    }
  }

  // --- Helper Methods ---

  /**
   * 사용자 정보 조회
   */
  private async getUserInfos(userId: string): Promise<DashboardUserInfos> {
    const { prisma } = this.fastify

    // 사용자 기본 정보
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        pic_url: true,
      },
    })

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found')
    }

    // 완료된 인터뷰 수
    const interviewCount = await prisma.interviewSession.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    })

    // 평균 점수 (DB aggregate 사용)
    const scoreAggregate = await prisma.interviewSession.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        averageScore: { not: null },
      },
      _avg: {
        averageScore: true,
      },
    })

    const averageScore = scoreAggregate._avg.averageScore
      ? Math.round(scoreAggregate._avg.averageScore * 10) / 10
      : 0

    // 가장 많이 진행한 직무 (모든 status에 대해서)
    // jobTitle이랑 jobSpec을 그룹으로 묶어서 계산
    const jobGroups = await prisma.interviewSession.groupBy({
      by: ['jobTitle', 'jobSpec'],
      where: {
        userId,
      },
      _count: {
        jobTitle: true,
      },
      orderBy: {
        _count: {
          jobTitle: 'desc',
        },
      },
      take: 1,
    })

    const mostJob = jobGroups[0]

    return {
      name: user.name || 'User',
      mostJobTitle: mostJob?.jobTitle || '-',
      mostJobSpec: mostJob?.jobSpec || '-',
      profileImg: user.pic_url,
      interviewCount,
      averageScore,
    }
  }

  /**
   * 최근 인터뷰 조회 (READY 또는 IN_PROGRESS 중 가장 최근)
   */
  private async getRecentInterview(
    userId: string,
  ): Promise<DashboardInterview> {
    const { prisma } = this.fastify

    const session = await prisma.interviewSession.findFirst({
      where: {
        userId,
        status: { in: ['READY', 'IN_PROGRESS'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        title: true,
        company: true,
        jobTitle: true,
        jobSpec: true,
      },
    })

    // 없으면 빈 객체 반환
    if (!session) {
      return {} as DashboardInterview
    }

    return {
      id: session.id,
      status: session.status as 'IN_PROGRESS' | 'READY',
      title: session.title,
      company: session.company,
      jobTitle: session.jobTitle,
      jobSpec: session.jobSpec,
    }
  }

  /**
   * 최근 완료된 리포트 조회 (최대 N개)
   */
  private async getRecentReports(
    userId: string,
    limit: number = 2,
  ): Promise<DashboardReportItem[]> {
    const { prisma } = this.fastify

    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        jobTitle: true,
        jobSpec: true,
        updatedAt: true,
      },
    })

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      jobTitle: s.jobTitle,
      jobSpec: s.jobSpec,
      finishDate: s.updatedAt.toISOString().split('T')[0], // YYYY-MM-DD
    }))
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    dashboardService: DashboardService
  }
}

export default fp(
  async (fastify) => {
    const dashboardService = new DashboardService(fastify)
    fastify.decorate('dashboardService', dashboardService)
  },
  {
    name: 'dashboardService',
    dependencies: ['prisma'],
  },
)
