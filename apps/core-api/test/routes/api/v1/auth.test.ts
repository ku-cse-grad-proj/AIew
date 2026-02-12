import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { build, FastifyInstance } from '../../../helper'

import { User } from '@/generated/prisma/client'

describe('Auth - RTR + Logout (/api/v1/refresh, /api/v1/auth/logout)', () => {
  let app: FastifyInstance
  let testUser: User

  beforeAll(async () => {
    app = await build()
    testUser = await app.prisma.user.create({
      data: {
        email: `auth-test-${Date.now()}@example.com`,
        name: 'Auth Test User',
        provider: 'GITHUB',
      },
    })
  })

  afterAll(async () => {
    // Redis 정리
    await app.redis.del(`refresh:${testUser.id}`)
    await app.prisma.user.delete({ where: { id: testUser.id } })
    await app.close()
  })

  it('POST /api/v1/refresh - 정상 refresh → 새 accessToken + refreshToken 쿠키 발급', async () => {
    // 토큰 쌍 생성
    const { refreshToken } = await app.authService.generateTokenPair(
      testUser.id,
    )

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken },
    })

    expect(res.statusCode).toBe(204)

    // set-cookie 헤더에 accessToken + refreshToken 2개 확인
    const cookies = res.cookies as { name: string; value: string }[]
    const accessCookie = cookies.find((c) => c.name === 'accessToken')
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken')

    expect(accessCookie).toBeDefined()
    expect(refreshCookie).toBeDefined()
    expect(accessCookie!.value).toBeTruthy()
    expect(refreshCookie!.value).toBeTruthy()

    // Redis에 새 jti가 저장되었는지 확인
    const storedJti = await app.redis.get(`refresh:${testUser.id}`)
    expect(storedJti).toBeTruthy()
  })

  it('POST /api/v1/refresh - 토큰 재사용 감지 → 401 + Redis 키 삭제', async () => {
    // 토큰 쌍 생성
    const { refreshToken: originalToken } =
      await app.authService.generateTokenPair(testUser.id)

    // 1차 refresh — 성공 (jti가 rotation됨)
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: originalToken },
    })
    expect(res1.statusCode).toBe(204)

    // 2차 refresh — 같은 토큰으로 재시도 → 재사용 감지
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: originalToken },
    })
    expect(res2.statusCode).toBe(401)

    // Redis 키가 삭제되었는지 확인 (전체 무효화)
    const storedJti = await app.redis.get(`refresh:${testUser.id}`)
    expect(storedJti).toBeNull()
  })

  it('POST /api/v1/auth/logout → Redis 키 삭제 + 이후 refresh 불가', async () => {
    // 토큰 쌍 생성
    const { accessToken, refreshToken } =
      await app.authService.generateTokenPair(testUser.id)

    // Redis에 jti 저장 확인
    const jtiBefore = await app.redis.get(`refresh:${testUser.id}`)
    expect(jtiBefore).toBeTruthy()

    // 로그아웃
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { accessToken },
    })
    expect(logoutRes.statusCode).toBe(200)

    // Redis 키 삭제 확인
    const jtiAfter = await app.redis.get(`refresh:${testUser.id}`)
    expect(jtiAfter).toBeNull()

    // 로그아웃 후 refresh 시도 → 실패
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken },
    })
    expect(refreshRes.statusCode).toBe(401)
  })

  it('POST /api/v1/refresh - refreshToken 없이 요청 → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
    })
    expect(res.statusCode).toBe(401)
  })
})
