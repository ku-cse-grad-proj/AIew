import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '../../../../configs/swaggerOption'

interface JWTPayload {
  userId: string
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const routePath: string = '/'
  const postOpts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.User],
      summary: '쿠키 속 refresh_token으로 accessToken 재발급',
      description:
        'HttpOnly, Secure 쿠키로 전달된 Refresh Token을 검증하여 새로운 Access Token을 발급합니다.<br/><br/>' +
        '**❗중요**: 이 API는 `HttpOnly` 쿠키를 사용하므로 Swagger UI의 "Try it out" 기능으로 직접 테스트할 수 없습니다.<br/>' +
        '테스트하려면 프론트의 OAuth 로그인을 통해 토큰을 받은 후 실행하세요.',
    },
  }
  const postHandler: RouteHandlerMethod = async (request, reply) => {
    try {
      // 1. 쿠키에서 리프레시 토큰 문자열을 직접 가져옵니다.
      const refreshToken = request.cookies.refresh_token
      if (!refreshToken) {
        return reply.status(401).send({ message: 'No refresh token provided' })
      }

      // 2. fastify.jwt.verify()를 사용하여 토큰을 수동으로 검증합니다.
      const decoded = fastify.jwt.verify<JWTPayload>(refreshToken)

      // 3. DB에서 사용자가 여전히 유효한지 확인합니다.
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        reply.clearCookie('refresh_token')
        return reply.status(401).send({ message: 'Unauthorized' })
      }

      // 4. 새로운 Access Token을 발급합니다.
      const accessToken = await reply.jwtSign(
        { userId: user.id },
        { expiresIn: '15m' },
      )
      return { accessToken }
    } catch (err) {
      // 토큰이 유효하지 않거나 만료된 경우
      fastify.log.error(err)
      reply.clearCookie('refresh_token')
      return reply.status(401).send({ message: 'Unauthorized' })
    }
  }

  fastify.post(routePath, postOpts, postHandler)
}

export default authRoutes
