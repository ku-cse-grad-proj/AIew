import {
  FastifyPluginAsync,
  RequestGenericInterface,
  RouteHandler,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

interface requestGeneric extends RequestGenericInterface {
  Params: {
    sessionId: string
  }
}

const get: FastifyPluginAsync = async (fastify) => {
  const routePath: string = '/'
  const opts: RouteShorthandOptions = {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '사용자가 생성한 단일 면접 조회',
      description: '`sessionId`를 parameter로 받아와 일치하는 면접 조회',
      params: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: '면접 세션의 ID',
          },
        },
        required: ['sessionId'],
      },
      response: {
        200: {
          $ref: SchemaId.Interview,
        },
        404: {
          $ref: SchemaId.Error,
        },
      },
    },
  }
  const handler: RouteHandler<requestGeneric> = async (request, reply) => {
    const session = await fastify.prisma.interviewSession.findFirst({
      where: {
        id: request.params.sessionId,
        userId: request.user.userId,
      },
    })

    if (!session) return reply.notFound('')
    reply.send(session)
  }
  fastify.get<requestGeneric>(routePath, opts, handler)
}

export default get
