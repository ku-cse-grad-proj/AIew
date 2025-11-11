import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_DashboardCompanyGraphResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  const getSchema: FastifySchema = {
    tags: [Tag.Dashboard],
    summary: '회사별 그래프 데이터 조회',
    description:
      '인터뷰의 회사별 분포를 조회합니다. 상위 5개 회사와 나머지는 Others로 집계됩니다.',
    response: {
      200: S_DashboardCompanyGraphResponse,
      401: { description: '인증 실패', $ref: SchemaId.Error },
    },
  }

  const getHandler: RouteHandler = async (request, reply) => {
    const { userId } = request.user

    const data = await fastify.dashboardService.getCompanyGraphData(userId, 6)
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
