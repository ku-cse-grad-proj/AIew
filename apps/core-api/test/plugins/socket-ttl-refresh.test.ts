import { Socket as ServerSocket } from 'socket.io'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  build,
  createTestUserAndToken,
  FastifyInstance,
  startWebSocketClient,
} from '../helper'

import { User } from '@/generated/prisma/client'

describe('Socket TTL refresh on pong', () => {
  let app: FastifyInstance
  let testUser: User
  let token: string

  beforeAll(async () => {
    process.env.AI_SERVER_URL = 'http://mock-ai-server.com'
    app = await build()
    const userData = await createTestUserAndToken(app)
    testUser = userData.user
    token = userData.accessToken
  }, 30000)

  afterAll(async () => {
    await app.prisma.user.delete({ where: { id: testUser.id } })
    delete process.env.AI_SERVER_URL
  })

  it('should call refreshTtl on pong only when sessionId is set, with leading-edge throttle', async () => {
    const refreshSpy = vi
      .spyOn(app.aiClientService, 'refreshTtl')
      .mockResolvedValue(undefined)

    const client = startWebSocketClient(app, token)

    await new Promise<void>((resolve, reject) => {
      client.once('connect', resolve)
      client.once('connect_error', reject)
    })

    const session = await app.prisma.interviewSession.create({
      data: {
        userId: testUser.id,
        title: 'TTL Refresh Test',
        company: 'TestCo',
        jobTitle: 'Tester',
        jobSpec: 'Testing',
      },
    })

    try {
      // 서버 측 소켓 조회
      const serverSocket: ServerSocket = app.io.sockets.sockets.get(client.id!)!
      expect(serverSocket).toBeDefined()

      // 1. Pong before joining room (no sessionId) → should NOT trigger
      serverSocket.conn.emit('packet', { type: 'pong' })
      expect(refreshSpy).not.toHaveBeenCalled()

      // 2. Join room → 즉시 TTL 갱신 (재접속 시 만료 방지)
      client.emit('client:join-room', { sessionId: session.id })
      await new Promise<void>((resolve) =>
        client.once('server:room-joined', resolve),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(1)
      expect(refreshSpy).toHaveBeenCalledWith(session.id)

      // 3. Pong after join → throttle에 의해 억제 (join에서 이미 타이머 시작)
      serverSocket.conn.emit('packet', { type: 'pong' })
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    } finally {
      client.disconnect()
      await app.prisma.interviewSession.delete({ where: { id: session.id } })
    }
  })
})
