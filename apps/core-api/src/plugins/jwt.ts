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
          fastify.log.error(err)
          reply.send(err)
        }
      },
    )
  },
  {
    name: 'jwt',
  },
)
