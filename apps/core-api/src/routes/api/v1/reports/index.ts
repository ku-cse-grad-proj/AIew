import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_ReportsQueryParams, S_ReportsResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/reports
  const getSchema: FastifySchema = {
    tags: [Tag.Report],
    summary: '페이지별 리포트 목록 조회 (최대 10개)',
    description:
      '완료된 면접 세션들의 리포트 목록을 반환합니다.<br>' +
      'query parameter를 통해 검색, 필터링, 정렬, 페이지네이션이 가능합니다.',
    querystring: S_ReportsQueryParams,
    response: {
      200: S_ReportsResponse,
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

    const reports = await fastify.reportService.getReports(queryParams)
    reply.send(reports)
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
