import { Static } from '@sinclair/typebox'
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

  const getHandler: RouteHandler<{
    Querystring: Static<typeof S_ReportsQueryParams>
  }> = async (request, reply) => {
    const { userId } = request.user
    const queryParams = request.query

    const reports = await fastify.reportService.getReports(userId, queryParams)
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
