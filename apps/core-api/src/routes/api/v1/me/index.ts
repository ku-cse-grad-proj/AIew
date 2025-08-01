import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '../../../../configs/swaggerOption'
import SchemaId from '../../../../utils/schemaId'

const meRoute: FastifyPluginAsync = async (fastify) => {
  const path: string = '/'
  const getOpts: RouteShorthandOptions = {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [Tag.User],
      summary: '현재 로그인된 사용자 정보 조회',
      response: {
        '200': {
          description: '성공적으로 사용자 정보 반환',
          $ref: SchemaId.User,
        },
        '401': {
          description: '인증되지 않은 사용자',
          $ref: SchemaId.Error,
        },
        '404': {
          description: '사용자를 찾을 수 없음',
          $ref: SchemaId.Error,
        },
      },
    },
  }
  const getHandler: RouteHandlerMethod = async (request, reply) => {
    // Set Cache-Control header to prevent caching of this sensitive response
    reply.headers({
      'cache-control': 'no-store, max-age=0 must-revalidate',
      pragma: 'no-cache',
      expires: '0',
    })

    // The 'authenticate' hook has already verified the token
    // and attached the payload to request.user
    const { userId } = request.user

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      // Exclude sensitive data like password if you add it later
      select: {
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return reply.status(404).send({ message: 'User not found' })
    }

    return user
  }

  fastify.get(path, getOpts, getHandler)
}

export default meRoute
