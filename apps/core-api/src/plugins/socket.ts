import fp from 'fastify-plugin'
import { Server, Socket } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

export default fp(
  async (fastify) => {
    // socket.io 서버를 생성하고, Fastify의 HTTP 서버에 연결합니다.
    const io = new Server(fastify.server, {
      cors: {
        origin: 'http://localhost:4000',
        credentials: true,
      },
    })

    // 생성된 io 인스턴스를 fastify.decorate를 통해 추가합니다.
    // 이제 다른 라우트나 플러그인에서 fastify.io로 접근할 수 있습니다.
    fastify.decorate('io', io)

    const onConnection = async (socket: Socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      // 클라이언트 연결 시 URL 쿼리에서 sessionId를 추출합니다.
      const sessionId = socket.handshake.query.sessionId as string
      if (!sessionId) {
        socket.emit('server:error', {
          code: 'SESSION_ID_REQUIRED',
          message: 'Session ID is required for connection.',
        })
        socket.disconnect(true)
        return
      }

      // 해당 sessionId의 방(room)에 클라이언트를 참여시킵니다.
      socket.join(sessionId)
      fastify.log.info(`Socket ${socket.id} joined room ${sessionId}`)

      try {
        // DB를 조회하여 질문이 이미 생성되었는지 확인합니다.
        const steps = await fastify.prisma.interviewStep.findMany({
          where: { interviewSessionId: sessionId },
          orderBy: { createdAt: 'asc' },
        })

        // 질문(steps)이 이미 존재한다면, 즉시 해당 클라이언트에게 전송합니다.
        if (steps.length > 0) {
          socket.emit('server:questions-ready', { steps })
        }
      } catch (error) {
        fastify.log.error(
          `Error fetching session ${sessionId} for socket ${socket.id}`,
          error,
        )
        socket.emit('server:error', {
          code: 'SESSION_FETCH_FAILED',
          message: 'Could not retrieve session details.',
        })
      }

      socket.on(
        'client:submit-answer',
        async (payload: {
          stepId: string
          answer: string
          duration: number
        }) => {
          try {
            await fastify.interviewService.processUserAnswer(
              sessionId,
              payload.stepId,
              payload.answer,
              payload.duration,
            )
          } catch (error) {
            fastify.log.error(
              `[${sessionId}] Error processing answer for step ${payload.stepId}: ${error}`,
            )
            socket.emit('server:error', {
              code: 'ANSWER_PROCESSING_FAILED',
              message: 'Failed to process your answer.',
            })
          }
        },
      )

      socket.on('disconnect', () => {
        fastify.log.info(
          `Socket disconnected: ${socket.id} from room ${sessionId}`,
        )
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
    name: 'io',
    dependencies: ['prisma'],
  },
)
