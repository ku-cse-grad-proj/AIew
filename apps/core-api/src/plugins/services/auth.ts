import { Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { S_AuthLogoutResponse } from '@/schemas/rest'

type AuthLogoutResponse = Static<typeof S_AuthLogoutResponse>

export class AuthService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 사용자 로그아웃 처리
   */
  public async logout(userId: string): Promise<AuthLogoutResponse> {
    // 로그 기록
    this.fastify.log.info(
      `User ${userId} logged out at ${new Date().toISOString()}`,
    )

    // TODO: Redis blacklist 추가 (Phase 2)
    // await this.addToBlacklist(accessToken, refreshToken)

    return { message: 'Logged out successfully' }
  }

  /**
   * Refresh Token을 사용하여 새로운 Access Token 발급
   * TODO: /api/v1/refresh 에 로직이 있으니 여기로 옮겨오면 됨
   */
  public async refreshToken(
    // eslint-disable-next-line
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    // TODO: refreshToken 검증
    // TODO: 새로운 accessToken 발급
    // TODO: 필요 시 refreshToken 갱신 (rotation)
    throw new Error('Not implemented')
  }

  /**
   * 특정 토큰을 무효화 (blacklist 추가)
   * TODO: 구현 필요 (Redis 필요)
   */
  // eslint-disable-next-line
  public async revokeToken(token: string): Promise<void> {
    // TODO: Redis blacklist에 토큰 추가
    // TODO: 만료 시간까지만 저장 (TTL)
    throw new Error('Not implemented')
  }

  /**
   * 토큰 유효성 검증 (blacklist 확인 포함)
   * TODO: 구현 필요 (Redis 필요)
   */
  // eslint-disable-next-line
  public async validateToken(token: string): Promise<boolean> {
    // TODO: JWT 서명 검증 (fastify.jwt.verify)
    // TODO: Redis blacklist 확인
    // TODO: 만료 시간 확인
    throw new Error('Not implemented')
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthService
  }
}

export default fp(
  async (fastify) => {
    const authService = new AuthService(fastify)
    fastify.decorate('authService', authService)
  },
  {
    name: 'authService',
  },
)
