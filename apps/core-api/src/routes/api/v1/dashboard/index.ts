import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_DashboardResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  const getSchema: FastifySchema = {
    tags: [Tag.Dashboard],
    summary: '대시보드 메인 데이터 조회',
    description:
      '사용자 정보, 최근 인터뷰, 최근 완료된 리포트를 한 번에 조회합니다.',
    response: {
      200: S_DashboardResponse,
      401: { description: '인증 실패', $ref: SchemaId.Error },
      404: { description: '사용자를 찾을 수 없음', $ref: SchemaId.Error },
    },
  }

  const getHandler: RouteHandler = async (request, reply) => {
    const { userId } = request.user

    const data = await fastify.dashboardService.getDashboard(userId)
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
