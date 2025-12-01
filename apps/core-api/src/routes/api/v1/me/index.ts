import {
  FastifyPluginAsync,
  FastifySchema,
  RouteHandler,
  RouteOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/me
  const getSchema: FastifySchema = {
    tags: [Tag.User],
    summary: '현재 로그인된 사용자 정보 조회 (GET /users/:userId 의 단축 경로)',
    description:
      '현재 로그인한 사용자의 정보를 반환합니다. `GET /api/v1/users/{자신의 ID}`와 동일한 역할을 하는 편의성 API입니다.',
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
  }

  const getHandler: RouteHandler = async (request, reply) => {
    // Set Cache-Control header to prevent caching of this sensitive response
    reply.headers({
      'cache-control': 'no-store, max-age=0 must-revalidate',
      pragma: 'no-cache',
      expires: '0',
    })

    // The 'authenticate' hook has already verified the token
    // and attached the payload to request.user
    const { userId } = request.user

    const user = await fastify.userService.getUserById(userId)

    if (!user) {
      return reply.notFound('User not found')
    }

    return user
  }

  const getOpts: RouteOptions = {
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: getSchema,
    handler: getHandler,
  }

  fastify.route(getOpts)
}

export default controller
