import * as assert from 'node:assert'
import { test } from 'node:test'

import { build } from '../../../helper'

test('GET /api/v1/me should fail without authentication', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/me',
  })

  assert.equal(res.statusCode, 401, 'should return 401 Unauthorized')
})

test('GET /api/v1/me should return user info with valid token', async (t) => {
  const app = await build(t)

  // 1. Create a temporary user for this test
  const testUser = await app.prisma.user.create({
    data: {
      email: `test-user-${Date.now()}@example.com`,
      name: 'Test User',
      provider: 'TEST',
    },
  })

  // 2. Generate a token for the user
  const token = await app.jwt.sign({ userId: testUser.id })

  // 3. Make the request with the token
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/me',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // 4. Assert the response
  assert.equal(res.statusCode, 200, 'should return 200 OK')
  const payload = JSON.parse(res.payload)
  assert.equal(
    payload.email,
    testUser.email,
    'should return the correct user email',
  )
  assert.equal(payload.name, 'Test User', 'should return the correct user name')

  // 5. Clean up the created user
  await app.prisma.user.delete({ where: { id: testUser.id } })
})
