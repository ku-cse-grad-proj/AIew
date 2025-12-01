import { Static } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_ReportsQueryParams, S_ReportsGraphResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/reports/graph
  const getSchema: FastifySchema = {
    tags: [Tag.Report],
    summary: '필터 조건에 맞는 리포트 그래프 데이터 조회',
    description:
      '검색 조건(searchParams)에 맞는 모든 완료된 면접 세션의 그래프 데이터를 반환합니다. ' +
      '페이지네이션 없이 모든 데이터를 시간순(updatedAt 오름차순)으로 반환합니다.',
    querystring: S_ReportsQueryParams,
    response: {
      200: S_ReportsGraphResponse,
      401: { description: '인증 실패', $ref: SchemaId.Error },
    },
  }

  const getHandler: RouteHandler<{
    Querystring: Static<typeof S_ReportsQueryParams>
  }> = async (request, reply) => {
    const graphData = await fastify.reportService.getReportsGraph(
      request.user.userId,
      request.query,
    )

    reply.send(graphData)
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
