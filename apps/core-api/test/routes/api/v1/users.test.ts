import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { build, createTestUserAndToken, FastifyInstance } from '../../../helper'

import { User } from '@/generated/prisma/client'

describe('User API (/api/v1/users & /api/v1/me)', () => {
  let app: FastifyInstance
  let mainTestUser: User
  let mainTestUserToken: string

  // Create a single app instance for all tests in this file
  beforeAll(async () => {
    app = await build()
    const { user, accessToken } = await createTestUserAndToken(app)
    mainTestUser = user
    mainTestUserToken = accessToken
  })

  // Cleanup the main user and close the app instance
  afterAll(async () => {
    if (mainTestUser) {
      await app.prisma.user.delete({ where: { id: mainTestUser.id } })
    }
    await app.close()
  })

  // --- Test Cases ---

  it('GET /api/v1/me - should return current user info', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      cookies: { accessToken: mainTestUserToken },
    })

    expect(res.statusCode).toBe(200)
    const payload = res.json<User>()
    expect(payload.id).toBe(mainTestUser.id)
    expect(payload.email).toBe(mainTestUser.email)
  })

  it('GET /api/v1/users/:userId - should get own user info', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${mainTestUser.id}`,
      cookies: { accessToken: mainTestUserToken },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json<User>().id).toBe(mainTestUser.id)
  })

  it('GET /api/v1/users/:userId - should get another user info', async () => {
    let anotherUser: User | null = null
    try {
      anotherUser = await app.prisma.user.create({
        data: {
          email: `another-${Date.now()}@test.com`,
          name: 'Another',
          provider: 'GOOGLE',
        },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${anotherUser.id}`,
        cookies: { accessToken: mainTestUserToken },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json<User>().id).toBe(anotherUser.id)
    } finally {
      if (anotherUser) {
        await app.prisma.user.delete({ where: { id: anotherUser.id } })
      }
    }
  })

  it('PATCH /api/v1/users/:userId - should update own user info', async () => {
    const newName = `UpdatedName-${Date.now()}`
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${mainTestUser.id}`,
      cookies: { accessToken: mainTestUserToken },
      payload: { name: newName },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json<User>().name).toBe(newName)

    // Verify in DB
    const dbUser = await app.prisma.user.findUnique({
      where: { id: mainTestUser.id },
    })
    expect(dbUser?.name).toBe(newName)
  })

  it('PATCH /api/v1/users/:userId - should FORBID updating another user', async () => {
    let anotherUser: User | null = null
    try {
      anotherUser = await app.prisma.user.create({
        data: {
          email: `another-${Date.now()}@test.com`,
          name: 'Another',
          provider: 'GITHUB',
        },
      })
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${anotherUser.id}`,
        cookies: { accessToken: mainTestUserToken },
        payload: { name: 'Should Not Update' },
      })
      expect(res.statusCode).toBe(403)
    } finally {
      if (anotherUser) {
        await app.prisma.user.delete({ where: { id: anotherUser.id } })
      }
    }
  })

  it('DELETE /api/v1/users/:userId - should FORBID deleting another user', async () => {
    let anotherUser: User | null = null
    try {
      anotherUser = await app.prisma.user.create({
        data: {
          email: `another-${Date.now()}@test.com`,
          name: 'Another',
          provider: 'GITHUB',
        },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${anotherUser.id}`,
        cookies: { accessToken: mainTestUserToken },
      })
      expect(res.statusCode).toBe(403)
    } finally {
      if (anotherUser) {
        await app.prisma.user.delete({ where: { id: anotherUser.id } })
      }
    }
  })

  it('DELETE /api/v1/users/:userId - should delete own account', async () => {
    // Create a dedicated user for this deletion test
    const { user: userToDelete, accessToken: tokenToDelete } =
      await createTestUserAndToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${userToDelete.id}`,
      cookies: { accessToken: tokenToDelete },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('User deleted successfully.')

    // Verify user is deleted from DB
    const dbUser = await app.prisma.user.findUnique({
      where: { id: userToDelete.id },
    })
    expect(dbUser).toBeNull()
  })
})
