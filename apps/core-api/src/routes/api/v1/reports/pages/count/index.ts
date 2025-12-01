import { Static } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import {
  S_ReportsQueryParams,
  S_ReportsPagesCountResponse,
} from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/reports/pages/count
  const getSchema: FastifySchema = {
    tags: [Tag.Report],
    summary: '전체 페이지 수 조회',
    description:
      '완료된 면접 세션의 전체 페이지 수를 반환합니다 (10개 단위).<br>' +
      'query parameter를 통해 필터링된 결과의 페이지 수를 계산합니다.',
    querystring: S_ReportsQueryParams,
    response: {
      200: S_ReportsPagesCountResponse,
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

    const totalPages = await fastify.reportService.getTotalPages(
      userId,
      queryParams,
    )
    reply.send(totalPages)
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
