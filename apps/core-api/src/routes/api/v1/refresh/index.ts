import {
  FastifyPluginAsync,
  FastifySchema,
  RouteHandler,
  RouteOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/refresh
  const postSchema: FastifySchema = {
    tags: [Tag.Auth],
    summary: '쿠키 속 refreshToken으로 accessToken 재발급',
    description:
      'HttpOnly, Secure 쿠키로 전달된 Refresh Token을 검증하여 새로운 Access Token을 발급합니다.<br/><br/>' +
      '**❗중요**: 이 API는 `HttpOnly` 쿠키를 사용하므로 Swagger UI의 "Try it out" 기능으로 직접 테스트할 수 없습니다.<br/>' +
      '테스트하려면 프론트의 OAuth 로그인을 통해 토큰을 받은 후 실행하세요.',
    response: {
      '204': {
        description:
          '성공. 새로운 Access Token이 HttpOnly 쿠키에 설정되었습니다. 응답 본문은 없습니다.',
      },
      '401': {
        description: '인증 실패',
        $ref: SchemaId.Error,
      },
    },
  }

  const postHandler: RouteHandler = async (request, reply) => {
    try {
      // 1. 쿠키에서 refreshToken 문자열 추출
      const refreshToken = request.cookies.refreshToken
      if (!refreshToken) {
        return reply.status(401).send({ message: 'No refresh token provided' })
      }

      // 2. AuthService를 통한 토큰 갱신 (비즈니스 로직)
      const { accessToken } =
        await fastify.authService.refreshToken(refreshToken)

      // 3. 새로운 Access Token을 HttpOnly 쿠키에 설정 (HTTP 레이어)
      reply.setCookie('accessToken', accessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15분
      })

      // 4. 204 No Content 응답 전송
      return reply.status(204).send()
    } catch (err) {
      // 토큰이 유효하지 않거나 만료된 경우
      fastify.log.error(err)
      reply.clearCookie('refreshToken')
      reply.clearCookie('accessToken')
      return reply.status(401).send({ message: 'Unauthorized' })
    }
  }

  // accessToken이 없을 때 오는 요청
  // fastify.authenticate 훅 사용 X
  const postOpts: RouteOptions = {
    method: 'POST',
    url: '/',
    schema: postSchema,
    handler: postHandler,
  }

  fastify.route(postOpts)
}

export default controller
