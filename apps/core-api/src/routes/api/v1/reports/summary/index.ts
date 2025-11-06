import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_ReportsQueryParams, S_ReportsSummaryResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/reports/summary
  const getSchema: FastifySchema = {
    tags: [Tag.Report],
    summary: '리포트 요약 통계 조회',
    description:
      '완료된 면접 세션들의 요약 통계 정보를 반환합니다.<br>' +
      '전체 리포트 개수, 평균 점수, 평균 소요 시간, 가장 많이 등장한 회사명을 포함합니다.<br>' +
      'query parameter를 통해 필터링된 결과의 통계를 계산합니다.',
    querystring: S_ReportsQueryParams,
    response: {
      200: S_ReportsSummaryResponse,
      400: {
        description: '잘못된 요청 (예: 잘못된 날짜 형식)',
        $ref: SchemaId.Error,
      },
    },
  }

  const getHandler: RouteHandler = async (request, reply) => {
    const queryParams = request.query as {
      title?: string
      company?: string
      from?: string
      to?: string
      job?: 'web' | 'app'
      detailJob?: 'front' | 'back'
      page?: number
      sort?: string
    }

    const summary = await fastify.reportService.getSummary(queryParams)
    reply.send(summary)
  }

  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: getSchema,
    handler: getHandler,
  })
}

export default controller
