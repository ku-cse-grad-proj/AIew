import jwt, { SignOptions } from '@fastify/jwt'
import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import { AccessTokenPayload, RefreshTokenPayload } from '@/types/jwt'

/**
 * Namespace별 페이로드 타입을 고정하는 JWT 래퍼
 * 명시적 generic 없이도 sign/verify 타입 안전성 확보
 */
interface TypedJWT<TPayload> {
  sign(payload: TPayload, options?: Partial<SignOptions>): string
  verify(token: string): TPayload
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }

  interface FastifyRequest {
    accessJwtVerify(): Promise<AccessTokenPayload>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload
    user: AccessTokenPayload
  }

  interface JWT {
    access: TypedJWT<AccessTokenPayload>
    refresh: TypedJWT<RefreshTokenPayload>
  }
}

export default fp(
  async (fastify) => {
    // Access Token용 JWT (쿠키에서 자동 추출)
    fastify.register(jwt, {
      secret: process.env.JWT_SECRET as string,
      namespace: 'access',
      sign: { algorithm: 'HS256', expiresIn: '15m' },
      verify: { algorithms: ['HS256'] },
      cookie: {
        cookieName: 'accessToken',
        signed: false,
      },
    })

    // Refresh Token용 JWT (별도 secret)
    fastify.register(jwt, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      namespace: 'refresh',
      sign: { algorithm: 'HS256', expiresIn: '7d' },
      verify: { algorithms: ['HS256'] },
    })

    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.accessJwtVerify()
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
