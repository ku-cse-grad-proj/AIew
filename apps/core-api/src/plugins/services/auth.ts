import { Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { S_AuthLogoutResponse } from '@/schemas/rest'
import { JWTPayload } from '@/types/jwt'

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
   */
  public async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; userId: string }> {
    try {
      // JWT 검증
      const decoded = this.fastify.jwt.verify<JWTPayload>(refreshToken)

      // DB에서 사용자 확인
      const user = await this.fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        throw this.fastify.httpErrors.unauthorized('User not found')
      }

      // 새 accessToken 발급
      const accessToken = await this.fastify.jwt.sign(
        { userId: user.id },
        { expiresIn: '15m' },
      )

      // 로그 기록
      this.fastify.log.info(
        `Access token refreshed for user ${user.id} at ${new Date().toISOString()}`,
      )

      // TODO: refreshToken rotation
      // TODO: Redis blacklist 확인

      return { accessToken, userId: user.id }
    } catch (error) {
      // JWT 검증 실패, 만료 등
      this.fastify.log.error(error, 'Refresh token validation failed')
      throw this.fastify.httpErrors.unauthorized(
        'Invalid or expired refresh token',
      )
    }
  }

  /**
   * userId를 받아 accessToken과 refreshToken 쌍을 생성
   */
  public async generateTokenPair(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.fastify.jwt.sign(
      { userId },
      { expiresIn: '15m' },
    )

    const refreshToken = await this.fastify.jwt.sign(
      { userId },
      { expiresIn: '7d' },
    )

    this.fastify.log.info(
      `Token pair generated for user ${userId} at ${new Date().toISOString()}`,
    )

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
