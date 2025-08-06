import {
  FastifyPluginAsync,
  RouteHandler,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

const route: FastifyPluginAsync = async (fastify) => {
  const routePath: string = '/'
  const opts: RouteShorthandOptions = {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '사용자가 생성한 모든 면접 세션 목록 조회',
      description: '사용자가 생성한 면접 세션들의 목록을 반환합니다.',
      response: {
        '200': {
          type: 'array',
          items: {
            $ref: SchemaId.Interview,
          },
        },
      },
    },
  }
  const handler: RouteHandler = async (request, reply) => {
    const sessions = await fastify.prisma.interviewSession.findMany({
      where: {
        userId: request.user.userId,
        currentQuestionIndex: 0,
      },
      orderBy: {
        createdAt: 'desc', // 최신순으로 정렬
      },
    })
    reply.send(sessions)
  }

  fastify.get(routePath, opts, handler)
}
export default route
