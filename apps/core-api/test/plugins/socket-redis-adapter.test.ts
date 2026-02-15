import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  build,
  createTestUserAndToken,
  FastifyInstance,
  startWebSocketClient,
} from '../helper'

import { User } from '@/generated/prisma/client'

describe('Socket.IO Redis Adapter', () => {
  let app1: FastifyInstance
  let app2: FastifyInstance
  let testUser: User
  let token: string

  beforeAll(async () => {
    app1 = await build()
    app2 = await build()
    const userData = await createTestUserAndToken(app1)
    testUser = userData.user
    token = userData.accessToken
  }, 30000)

  afterAll(async () => {
    await app1.prisma.user.delete({ where: { id: testUser.id } })
  })

  it('should deliver broadcast to clients on different server instances via Redis', async () => {
    const client1 = startWebSocketClient(app1, token)
    const client2 = startWebSocketClient(app2, token)

    try {
      // 두 클라이언트 연결 대기
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          client1.once('connect', resolve)
          client1.once('connect_error', reject)
        }),
        new Promise<void>((resolve, reject) => {
          client2.once('connect', resolve)
          client2.once('connect_error', reject)
        }),
      ])

      // 테스트용 세션 생성 (Room ID로 사용)
      const session = await app1.prisma.interviewSession.create({
        data: {
          userId: testUser.id,
          title: 'Redis Adapter Test',
          company: 'TestCo',
          jobTitle: 'Tester',
          jobSpec: 'Testing',
        },
      })

      try {
        // 두 클라이언트 모두 같은 Room에 join
        client1.emit('client:join-room', { sessionId: session.id })
        client2.emit('client:join-room', { sessionId: session.id })

        await Promise.all([
          new Promise<void>((resolve) =>
            client1.once('server:room-joined', resolve),
          ),
          new Promise<void>((resolve) =>
            client2.once('server:room-joined', resolve),
          ),
        ])

        // app1에서 broadcast → app2에 연결된 client2가 수신해야 함
        // Redis Adapter 없이는 client2가 이 이벤트를 받을 수 없음
        const receivedPromise = new Promise<{ msg: string }>(
          (resolve, reject) => {
            const timeout = setTimeout(
              () =>
                reject(
                  new Error(
                    'Timeout: cross-instance broadcast not received within 5s',
                  ),
                ),
              5000,
            )
            client2.once('server:cross-instance-test', (data) => {
              clearTimeout(timeout)
              resolve(data)
            })
          },
        )

        app1.io.to(session.id).emit('server:cross-instance-test', {
          msg: 'hello from app1',
        })

        const received = await receivedPromise
        expect(received.msg).toBe('hello from app1')
      } finally {
        await app1.prisma.interviewSession.delete({
          where: { id: session.id },
        })
      }
    } finally {
      client1.disconnect()
      client2.disconnect()
    }
  })
})
