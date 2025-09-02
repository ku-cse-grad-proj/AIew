import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

const controller: FastifyPluginAsync = async (fastify) => {
  const schema: FastifySchema = {
    tags: [Tag.Interview],
    summary: '사용자가 생성한 모든 면접 세션 목록 조회',
    description: '사용자가 생성한 면접 세션들의 목록을 반환합니다.',
    response: {
      '200': {
        $ref: SchemaId.InterviewList,
      },
    },
  }

  const handler: RouteHandler = async (request, reply) => {
    const interviews = await fastify.interviewService.getUserInterviews(
      request.user.userId,
    )
    reply.send(interviews)
  }

  fastify.route({
    onRequest: [fastify.authenticate],
    method: 'GET',
    url: '/',
    schema,
    handler,
  })
}
export default controller
