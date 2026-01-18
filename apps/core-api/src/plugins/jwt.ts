import jwt from '@fastify/jwt'
import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import { JWTPayload } from '@/types/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload
    user: JWTPayload
  }
}

export default fp(
  async (fastify) => {
    fastify.register(jwt, {
      secret: process.env.JWT_SECRET as string,
      sign: { algorithm: 'HS256' }, // 명시적 알고리즘 지정
      verify: { algorithms: ['HS256'] }, // 알고리즘 다운그레이드 공격 방지
      cookie: {
        cookieName: 'accessToken', // request.jwtVerify()는 반드시 액세스토큰을 찾음
        signed: false, // JWT에서 이미 서명되어있음
      },
    })

    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify()
        } catch (err) {
          fastify.log.error(err, 'JWT verification failed')
          reply.code(401).send({ message: 'Unauthorized' })
        }
      },
    )
  },
  {
    name: 'jwt',
  },
)
