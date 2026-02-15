import crypto from 'node:crypto'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { build, FastifyInstance } from '../../../helper'

import { User } from '@/generated/prisma/client'

describe('Auth - RTR + Logout (/api/v1/refresh, /api/v1/auth/logout)', () => {
  let app: FastifyInstance
  let testUser: User
  const deviceId = crypto.randomUUID()

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
    // Redis 정리 — 디바이스별 키 패턴 삭제
    const keys = await app.redis.keys(`refresh:${testUser.id}:*`)
    if (keys.length > 0) await app.redis.del(...keys)
    await app.prisma.user.delete({ where: { id: testUser.id } })
    await app.close()
  })

  it('POST /api/v1/refresh - 정상 refresh → 새 accessToken + refreshToken 쿠키 발급', async () => {
    // 토큰 쌍 생성
    const { refreshToken } = await app.authService.generateTokenPair(
      testUser.id,
      deviceId,
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

    // 새 accessToken에 userId + deviceId가 포함되는지 verify
    const accessPayload = app.jwt.access.verify(accessCookie!.value)
    expect(accessPayload.userId).toBe(testUser.id)
    expect(accessPayload.deviceId).toBe(deviceId)

    // 새 refreshToken에 userId + deviceId + jti가 포함되는지 verify
    const refreshPayload = app.jwt.refresh.verify(refreshCookie!.value)
    expect(refreshPayload.userId).toBe(testUser.id)
    expect(refreshPayload.deviceId).toBe(deviceId)
    expect(refreshPayload.jti).toBeTruthy()

    // Redis에 새 jti가 저장되었는지 확인
    const storedJti = await app.redis.get(`refresh:${testUser.id}:${deviceId}`)
    expect(storedJti).toBe(refreshPayload.jti)
  })

  it('POST /api/v1/refresh - 토큰 재사용 감지 → 401 + Redis 키 삭제', async () => {
    // 토큰 쌍 생성
    const { refreshToken: originalToken } =
      await app.authService.generateTokenPair(testUser.id, deviceId)

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

    // Redis 키가 삭제되었는지 확인 (해당 디바이스 무효화)
    const storedJti = await app.redis.get(`refresh:${testUser.id}:${deviceId}`)
    expect(storedJti).toBeNull()
  })

  it('POST /api/v1/auth/logout → Redis 키 삭제 + 이후 refresh 불가', async () => {
    // 토큰 쌍 생성
    const { accessToken, refreshToken } =
      await app.authService.generateTokenPair(testUser.id, deviceId)

    // Redis에 jti 저장 확인
    const jtiBefore = await app.redis.get(`refresh:${testUser.id}:${deviceId}`)
    expect(jtiBefore).toBeTruthy()

    // 로그아웃
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { accessToken },
    })
    expect(logoutRes.statusCode).toBe(200)

    // Redis 키 삭제 확인
    const jtiAfter = await app.redis.get(`refresh:${testUser.id}:${deviceId}`)
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

  // --- 다중 디바이스 테스트 ---

  it('다중 디바이스 독립성 — device1 refresh가 device2에 영향 없음', async () => {
    const device1 = crypto.randomUUID()
    const device2 = crypto.randomUUID()

    // 두 디바이스에서 각각 토큰 발급
    const tokens1 = await app.authService.generateTokenPair(
      testUser.id,
      device1,
    )
    const tokens2 = await app.authService.generateTokenPair(
      testUser.id,
      device2,
    )

    // device1에서 refresh
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens1.refreshToken },
    })
    expect(res1.statusCode).toBe(204)

    // device2의 refresh는 여전히 유효
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens2.refreshToken },
    })
    expect(res2.statusCode).toBe(204)
  })

  it('특정 디바이스만 로그아웃 — device1 logout 후 device2 여전히 유효', async () => {
    const device1 = crypto.randomUUID()
    const device2 = crypto.randomUUID()

    // 두 디바이스에서 각각 토큰 발급
    const tokens1 = await app.authService.generateTokenPair(
      testUser.id,
      device1,
    )
    const tokens2 = await app.authService.generateTokenPair(
      testUser.id,
      device2,
    )

    // device1 로그아웃
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { accessToken: tokens1.accessToken },
    })
    expect(logoutRes.statusCode).toBe(200)

    // device1의 refresh → 실패
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens1.refreshToken },
    })
    expect(res1.statusCode).toBe(401)

    // device2의 refresh → 여전히 성공
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens2.refreshToken },
    })
    expect(res2.statusCode).toBe(204)
  })

  it('토큰 재사용 감지가 해당 디바이스에만 영향', async () => {
    const device1 = crypto.randomUUID()
    const device2 = crypto.randomUUID()

    // 두 디바이스에서 각각 토큰 발급
    const tokens1 = await app.authService.generateTokenPair(
      testUser.id,
      device1,
    )
    const tokens2 = await app.authService.generateTokenPair(
      testUser.id,
      device2,
    )

    // device1에서 refresh 성공 (jti rotation)
    await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens1.refreshToken },
    })

    // device1에서 같은 토큰 재사용 → 해당 디바이스 무효화
    const reuse = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens1.refreshToken },
    })
    expect(reuse.statusCode).toBe(401)

    // device1의 Redis 키 삭제 확인
    const d1Jti = await app.redis.get(`refresh:${testUser.id}:${device1}`)
    expect(d1Jti).toBeNull()

    // device2는 영향 없음 — 여전히 유효
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/refresh',
      cookies: { refreshToken: tokens2.refreshToken },
    })
    expect(res2.statusCode).toBe(204)
  })
})
