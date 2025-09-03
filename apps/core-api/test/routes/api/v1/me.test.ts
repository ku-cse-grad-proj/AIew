import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { build, FastifyInstance } from '../../../helper'

describe('GET /api/v1/me', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await build()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should fail without authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
    })

    expect(res.statusCode).toBe(401)
  })

  it('should return user info with valid token', async () => {
    // 1. Create a temporary user for this test
    const testUser = await app.prisma.user.create({
      data: {
        email: `test-user-${Date.now()}@example.com`,
        name: 'Test User',
        provider: 'GITHUB',
      },
    })

    // 2. Generate a token for the user
    const token = await app.jwt.sign({ userId: testUser.id })

    // 3. Make the request with the token in a cookie
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      cookies: {
        accessToken: token,
      },
    })

    // 4. Assert the response
    expect(res.statusCode).toBe(200)
    const payload = JSON.parse(res.payload)
    expect(payload.email).toBe(testUser.email)
    expect(payload.name).toBe('Test User')

    // 5. Clean up the created user
    await app.prisma.user.delete({ where: { id: testUser.id } })
  })
})
