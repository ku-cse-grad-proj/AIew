import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'

const warningRoute: FastifyPluginAsync = async (fastify) => {
  const pathRoute: string = '/'

  const postOpts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Warning],
      summary: '특정 이름의 사용자와 관련 데이터를 모두 삭제 (주의!)',
      description:
        '쿼리 파라미터로 받은 이름과 일치하는 모든 사용자를 찾아, 해당 사용자와 관련된 모든 면접 세션을 먼저 삭제한 후, 사용자를 삭제합니다.',
      querystring: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: '삭제할 사용자의 이름',
            default: '나형진',
          },
        },
      },
      response: {
        '200': {
          description: '성공적으로 삭제됨',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        '404': {
          description: '해당 이름의 사용자를 찾을 수 없음',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }

  const postHandler: RouteHandlerMethod = async (request, reply) => {
    const { name: targetUserName } = request.query as { name: string }

    // 삭제할 사용자 찾기
    const usersToDelete = await fastify.prisma.user.findMany({
      where: { name: targetUserName },
      select: { id: true }, // ID만 가져옴
    })

    if (usersToDelete.length === 0) {
      return reply
        .status(404)
        .send({ message: `'${targetUserName}' 사용자를 찾을 수 없습니다.` })
    }

    const userIdsToDelete = usersToDelete.map((user) => user.id)

    // 해당 사용자들이 생성한 모든 InterviewSession을 먼저 삭제
    await fastify.prisma.interviewSession.deleteMany({
      where: {
        userId: {
          in: userIdsToDelete,
        },
      },
    })

    // 사용자들 삭제
    const deleteResult = await fastify.prisma.user.deleteMany({
      where: {
        id: {
          in: userIdsToDelete,
        },
      },
    })

    return reply.status(200).send({
      message: `'${targetUserName}' 사용자 ${deleteResult.count}명과 관련 면접 세션을 모두 삭제했습니다!`,
    })
  }

  fastify.post(pathRoute, postOpts, postHandler)
}

export default warningRoute
