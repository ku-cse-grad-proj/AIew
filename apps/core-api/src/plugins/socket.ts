import { InterviewStep, User } from '@prisma/client'
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
            select: { id: true, status: true },
          })

          if (session) {
            await socket.join(sessionId)
            fastify.log.info(
              `Socket ${socket.id} joined room: ${sessionId} for user ${socket.user.id}`,
            )
            // 방 참여 성공을 클라이언트에게 알림 (For testing)
            socket.emit('server:room-joined', { sessionId })

            // Race Condition 해결: 만약 방에 접속했는데 질문 생성이 이미 완료된 상태라면,
            // 이벤트를 놓쳤을 수 있으니 해당 클라이언트에게만 다시 보내줍니다.
            if (
              session.status === 'READY' ||
              session.status === 'IN_PROGRESS' ||
              session.status === 'COMPLETED' // TODO: 완료 상태로 들어올 때 처리
            ) {
              fastify.log.info(
                `[${sessionId}] Questions are already ready. Notifying re-joined client ${socket.id}.`,
              )
              socket.emit('server:questions-ready', { sessionId })
            } else if (session.status === 'FAILED') {
              socket.emit('server:error', {
                code: 'INTERVIEW_SETUP_FAILED',
                message: 'Failed to set up the interview. Please try again.',
              })
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

      socket.on('client:ready', async ({ sessionId }) => {
        try {
          const session = await fastify.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId: socket.user.id },
          })
          if (!session) {
            return socket.emit('server:error', {
              message: 'Unauthorized or session not found.',
            })
          }

          let currentQuestion: InterviewStep | null = null

          if (session.status === 'IN_PROGRESS') {
            // 진행 중인 경우, 현재 인덱스의 메인 질문을 찾음
            const mainQuestions = await fastify.prisma.interviewStep.findMany({
              where: { interviewSessionId: sessionId, parentStepId: null },
              orderBy: { aiQuestionId: 'asc' },
            })
            currentQuestion = mainQuestions[session.currentQuestionIndex]
          } else if (session.status === 'READY') {
            // 준비 상태인 경우, 첫 번째 질문을 찾음
            currentQuestion = await fastify.prisma.interviewStep.findFirst({
              where: { interviewSessionId: sessionId },
              orderBy: { createdAt: 'asc' },
            })
          }

          if (currentQuestion) {
            // 헬퍼 메소드는 interviewService에서 가져와 사용
            const questionPayloadForAi =
              fastify.interviewService.formatStepToAiQuestion(currentQuestion)

            await fastify.aiClientService.logShownQuestion(
              { question: questionPayloadForAi },
              sessionId,
            )
            console.time('tts')
            const audioBase64 = await fastify.ttsService.generate(
              currentQuestion.question,
            )
            console.timeEnd('tts')

            socket.emit('server:next-question', {
              step: currentQuestion,
              isFollowUp: !!currentQuestion.parentStepId, // 꼬리질문 여부 확인
              audioBase64,
            })
          }
          // 다른 상태(COMPLETED, FAILED 등)에서는 아무것도 보내지 않음
        } catch (error) {
          fastify.log.error(
            `Error handling client:ready for session ${sessionId}:`,
            error,
          )
          socket.emit('server:error', {
            message: 'Failed to start or resume the interview.',
          })
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
