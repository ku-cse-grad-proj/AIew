import {
  FastifyPluginAsync,
  FastifySchema,
  RouteHandler,
  RouteOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_AuthLogoutResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/auth/logout
  const postSchema: FastifySchema = {
    tags: [Tag.Auth],
    summary: '로그아웃',
    description: '로그인된 사용자를 로그아웃 처리합니다.',
    response: {
      200: S_AuthLogoutResponse,
      401: { description: '인증 실패', $ref: SchemaId.Error },
    },
  }

  const postHandler: RouteHandler = async (request, reply) => {
    const { userId } = request.user

    // TODO: Redis 도입 시 refresh token 블랙리스트 처리 추가
    const result = await fastify.authService.logout(userId)

    // 쿠키 삭제는 Next.js Server Action에서 처리
    reply.send(result)
  }

  const postOpts: RouteOptions = {
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: postSchema,
    handler: postHandler,
  }

  fastify.route(postOpts)
}

export default controller
