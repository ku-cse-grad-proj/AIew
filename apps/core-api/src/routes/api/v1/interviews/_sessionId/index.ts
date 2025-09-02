import {
  FastifyPluginAsync,
  FastifySchema,
  RequestGenericInterface,
  RouteHandler,
} from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

interface requestGeneric extends RequestGenericInterface {
  Params: {
    sessionId: string
  }
}

const controller: FastifyPluginAsync = async (fastify) => {
  const schema: FastifySchema = {
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
        $ref: SchemaId.InterviewListItem,
      },
      '4XX': {
        $ref: SchemaId.Error,
      },
    },
  }

  const handler: RouteHandler<requestGeneric> = async (request, reply) => {
    const session = await fastify.interviewService.getInterviewSessionById(
      request.params.sessionId,
      request.user.userId,
    )

    if (!session) return reply.notFound('Interview session not found.')
    reply.send(session)
  }

  fastify.route<requestGeneric>({
    onRequest: [fastify.authenticate],
    method: 'GET',
    url: '/',
    schema,
    handler,
  })
}

export default controller
