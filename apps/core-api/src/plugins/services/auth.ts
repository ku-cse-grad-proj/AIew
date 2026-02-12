import crypto from 'node:crypto'

import { Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { S_AuthLogoutResponse } from '@/schemas/rest'

type AuthLogoutResponse = Static<typeof S_AuthLogoutResponse>

const REFRESH_TTL = 7 * 24 * 60 * 60 // 7일 (초)

export class AuthService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 사용자 로그아웃 처리 — Redis에서 refresh token 삭제
   */
  public async logout(userId: string): Promise<AuthLogoutResponse> {
    await this.fastify.redis.del(`refresh:${userId}`)
    this.fastify.log.info(`User ${userId} logged out`)
    return { message: 'Logged out successfully' }
  }

  /**
   * Refresh Token Rotation (RTR)
   * 저장된 jti와 비교 → 일치하면 새 토큰 쌍 발급, 불일치하면 전체 무효화
   */
  public async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const decoded = this.fastify.jwt.refresh.verify(refreshToken)

    // 저장된 jti와 비교
    const storedJti = await this.fastify.redis.get(`refresh:${decoded.userId}`)

    if (!storedJti || storedJti !== decoded.jti) {
      // 재사용 감지 -> 전체 무효화
      await this.fastify.redis.del(`refresh:${decoded.userId}`)
      throw this.fastify.httpErrors.unauthorized('Token reuse detected')
    }

    // DB에서 사용자 확인
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('User not found')
    }

    // 새 토큰 쌍 발급 (rotation) — 내부에서 Redis jti도 교체됨
    return {
      ...(await this.generateTokenPair(user.id)),
      userId: user.id,
    }
  }

  /**
   * userId를 받아 accessToken과 refreshToken 쌍을 생성
   * jti를 생성하여 Redis에 저장 (RTR)
   */
  public async generateTokenPair(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = crypto.randomUUID()

    const accessToken = this.fastify.jwt.access.sign({ userId })
    const refreshToken = this.fastify.jwt.refresh.sign({ userId, jti })

    // 현재 유효한 refresh token의 jti를 Redis에 저장
    await this.fastify.redis.set(`refresh:${userId}`, jti, 'EX', REFRESH_TTL)

    return { accessToken, refreshToken }
  }

  /**
   * OAuth 로그인 처리 (Google/GitHub 공통)
   * 사용자를 찾거나 생성하고, 토큰 쌍을 반환
   */
  public async handleOAuthLogin(
    email: string,
    userData: {
      name: string
      pic_url: string
      provider: 'GOOGLE' | 'GITHUB'
    },
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    // UserService를 통해 사용자 찾기 또는 생성
    const user = await this.fastify.userService.findOrCreateUserByEmail(
      email,
      userData,
    )

    // 토큰 쌍 생성
    const { accessToken, refreshToken } = await this.generateTokenPair(user.id)

    this.fastify.log.info(
      `OAuth login successful for user ${user.id} via ${userData.provider}`,
    )

    return { accessToken, refreshToken, userId: user.id }
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
