import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_DashboardLineGraphResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  const getSchema: FastifySchema = {
    tags: [Tag.Dashboard],
    summary: '라인 그래프 데이터 조회',
    description:
      '최근 완료된 인터뷰 10개의 타이틀, 평균 점수, 소요 시간을 조회합니다.',
    response: {
      200: S_DashboardLineGraphResponse,
      401: { description: '인증 실패', $ref: SchemaId.Error },
    },
  }

  const getHandler: RouteHandler = async (request, reply) => {
    const { userId } = request.user

    const data = await fastify.dashboardService.getLineGraphData(userId)
    reply.send(data)
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
