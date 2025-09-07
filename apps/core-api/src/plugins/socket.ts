import { User } from '@prisma/client'
import fp from 'fastify-plugin'
import { Server, Socket } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

declare module 'socket.io' {
  interface Socket {
    user: User
  }
}

function getAccessTokenFromCookieHeader(
  cookieHeader?: string,
): string | undefined {
  if (!cookieHeader) return undefined
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...rest] = c.trim().split('=')
      return [k, decodeURIComponent(rest.join('='))]
    }),
  )
  return cookies['accessToken']
}

export default fp(
  async (fastify) => {
    const io = new Server(fastify.server, {
      cors: {
        origin: process.env.WEB_CLIENT_URL || 'http://localhost:4000',
        credentials: true,
      },
    })

    fastify.decorate('io', io)

    // 인증 미들웨어
    io.use(async (socket, next) => {
      const token = getAccessTokenFromCookieHeader(
        socket.request.headers.cookie,
      )
      if (!token) {
        return next(new Error('Authentication error: Token not provided.'))
      }
      try {
        const decoded = fastify.jwt.verify<{ userId: string }>(token)
        const user = await fastify.prisma.user.findUnique({
          where: { id: decoded.userId },
        })
        if (!user) {
          return next(new Error('Authentication error: User not found.'))
        }
        socket.user = user
        next()
      } catch (err) {
        fastify.log.error('Socket authentication error:', err)
        return next(new Error('Authentication error: Invalid token.'))
      }
    })

    // 연결 핸들러
    const onConnection = (socket: Socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      socket.on('client:join-room', async ({ sessionId }) => {
        try {
          const session = await fastify.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId: socket.user.id },
          })
          if (session) {
            await socket.join(sessionId)
            fastify.log.info(
              `Socket ${socket.id} joined room: ${sessionId} for user ${socket.user.id}`,
            )
            // 방 참여 성공을 클라이언트에게 알림 (For testing)
            socket.emit('server:room-joined', { sessionId })

            // 재접속 시 이미 질문이 준비되었는지 확인 후 전송
            const steps = await fastify.prisma.interviewStep.findMany({
              where: { interviewSessionId: sessionId },
              orderBy: { createdAt: 'asc' },
            })

            // 질문(steps)이 이미 존재한다면, 즉시 해당 클라이언트에게 전송합니다.
            if (steps.length > 0) {
              socket.emit('server:questions-ready', { steps })
            }
          } else {
            fastify.log.warn(
              `Unauthorized attempt to join room ${sessionId} by user ${socket.user.id}`,
            )
            socket.emit('server:error', {
              message: 'Unauthorized or session not found.',
            })
          }
        } catch (error) {
          fastify.log.error(
            `Error joining room ${sessionId} for socket ${socket.id}:`,
            error,
          )
          socket.emit('server:error', { message: 'Error joining room.' })
        }
      })

      socket.on(
        'client:submit-answer',
        async (payload: {
          stepId: string
          answer: string
          duration: number
        }) => {
          try {
            const step = await fastify.prisma.interviewStep.findUnique({
              where: { id: payload.stepId },
              select: { interviewSessionId: true },
            })
            if (!step) {
              throw new Error(`Step with id ${payload.stepId} not found.`)
            }
            await fastify.interviewService.processUserAnswer(
              step.interviewSessionId,
              payload.stepId,
              payload.answer,
              payload.duration,
            )
          } catch (error) {
            fastify.log.error(
              `Error processing answer for step ${payload.stepId}:`,
              error,
            )
            socket.emit('server:error', {
              code: 'ANSWER_PROCESSING_FAILED',
              message: 'Failed to process your answer.',
            })
          }
        },
      )

      socket.on('disconnect', () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`)
      })
    }

    fastify.io.on('connection', onConnection)

    fastify.addHook('onClose', (instance, done) => {
      instance.io.close()
      done()
    })

    fastify.log.info('Socket.io plugin loaded')
  },
  {
    name: 'socket',
    dependencies: ['prisma', 'jwt'],
  },
)
