import { createAdapter } from '@socket.io/redis-adapter'
import fp from 'fastify-plugin'
import { Server, Socket } from 'socket.io'

import { InterviewStep, User } from '@/generated/prisma/client'
import { createPerfTimer } from '@/utils/perf-timer'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

declare module 'socket.io' {
  interface Socket {
    user: User
    sessionId?: string // 소켓 객체에 세션 ID 저장
    uploadChunks?: Buffer[] // 업로드 중인 청크 데이터
    ttlRefreshTimer?: ReturnType<typeof setTimeout> | null // TTL 갱신 throttle 타이머
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
        origin: process.env.API_BASE_URL || 'http://localhost:4000',
        credentials: true,
      },
    })

    fastify.decorate('io', io)

    // Redis Adapter 설정 (Blue-Green 배포 시 인스턴스 간 Room/이벤트 공유)
    let pubClient: ReturnType<typeof fastify.redis.duplicate> | undefined
    let subClient: ReturnType<typeof fastify.redis.duplicate> | undefined

    if (fastify.redis) {
      pubClient = fastify.redis.duplicate()
      subClient = fastify.redis.duplicate()
      io.adapter(createAdapter(pubClient, subClient))
      fastify.log.info('Socket.IO Redis adapter enabled')
    }

    // 인증 미들웨어
    io.use(async (socket, next) => {
      const token = getAccessTokenFromCookieHeader(
        socket.request.headers.cookie,
      )
      if (!token) {
        return next(new Error('Authentication error: Token not provided.'))
      }
      try {
        const decoded = fastify.jwt.access.verify(token)
        const user = await fastify.prisma.user.findUnique({
          where: { id: decoded.userId },
        })
        if (!user) {
          return next(new Error('Authentication error: User not found.'))
        }
        socket.user = user
        next()
      } catch (err) {
        fastify.log.error(err, 'Socket authentication error')
        return next(new Error('Authentication error: Invalid token.'))
      }
    })

    // 연결 핸들러
    const TTL_REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5분

    /** TTL 갱신 + throttle 타이머 세팅 (leading-edge) */
    function scheduleRefreshTtl(socket: Socket) {
      if (socket.ttlRefreshTimer || !socket.sessionId) return

      fastify.aiClientService.refreshTtl(socket.sessionId).catch((err) => {
        fastify.log.error(err, `[${socket.sessionId}] TTL refresh failed`)
      })
      socket.ttlRefreshTimer = setTimeout(() => {
        socket.ttlRefreshTimer = null
      }, TTL_REFRESH_INTERVAL_MS)
    }

    const onConnection = (socket: Socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      // Engine.IO pong 패킷 감지 → 주기적 TTL 갱신
      socket.conn.on('packet', ({ type }: { type: string }) => {
        if (type === 'pong') {
          scheduleRefreshTtl(socket)
        }
      })

      socket.on('client:join-room', async ({ sessionId }) => {
        try {
          const session = await fastify.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId: socket.user.id },
            select: { id: true, status: true, totalTimeSec: true },
          })

          if (session) {
            socket.sessionId = sessionId // 소켓에 세션 ID 저장
            await socket.join(sessionId)
            scheduleRefreshTtl(socket) // 즉시 TTL 갱신 (재접속 시 만료 방지)
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
                `[${sessionId}] Session status is ${session.status}. Notifying client ${socket.id}.`,
              )
              const answeredSteps = await fastify.prisma.interviewStep.findMany(
                {
                  where: {
                    interviewSessionId: sessionId,
                    parentStepId: null, // 메인 질문만,
                    answer: { not: null },
                  },
                  orderBy: { aiQuestionId: 'asc' },
                  include: {
                    tailSteps: {
                      where: { answer: { not: null } },
                      orderBy: { aiQuestionId: 'asc' },
                    },
                  },
                },
              )

              socket.emit('server:questions-ready', {
                sessionId,
                elapsedSec: session.totalTimeSec ?? 0,
                answeredSteps,
              })
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
            error,
            `Error joining room ${sessionId} for socket ${socket.id}`,
          )
          socket.emit('server:error', { message: 'Error joining room.' })
        }
      })

      socket.on('client:ready', async ({ sessionId }) => {
        try {
          const session = await fastify.prisma.interviewSession.findFirst({
            where: { id: sessionId, userId: socket.user.id },
            include: {
              steps: {
                where: { answer: { not: null } },
                orderBy: { aiQuestionId: 'asc' },
                include: {
                  criterionEvaluations: true,
                  parentStep: { select: { aiQuestionId: true } },
                },
              },
            },
          })
          if (!session) {
            return socket.emit('server:error', {
              message: 'Unauthorized or session not found.',
            })
          }

          // READY 또는 IN_PROGRESS일 때 백그라운드로 메모리 복구
          if (session.status === 'READY' || session.status === 'IN_PROGRESS') {
            const restoreData = {
              steps: session.steps.map((step) => ({
                aiQuestionId: step.aiQuestionId,
                type: step.type,
                question: step.question,
                criteria: step.criteria,
                skills: step.skills,
                rationale: step.rationale,
                estimatedAnswerTimeSec: step.estimatedAnswerTimeSec,
                parentQuestionId: step.parentStep?.aiQuestionId ?? null, // 존재 여부로 꼬리질문 판단
                answer: step.answer,
                answerDurationSec: step.answerDurationSec,
                evaluation: step.score
                  ? {
                      aiQuestionId: step.aiQuestionId,
                      type: step.type,
                      answerDurationSec: step.answerDurationSec ?? 0,
                      overallScore: step.score,
                      strengths: step.strengths,
                      improvements: step.improvements,
                      redFlags: step.redFlags,
                      criterionScores: step.criterionEvaluations.map((ce) => ({
                        name: ce.name,
                        score: ce.score,
                        reason: ce.reason,
                      })),
                      feedback: step.feedback ?? '',
                      tailRationale: null, // DB에 저장되지 않음
                      tailDecision: 'skip', // 복구 시점에는 이미 결정 완료
                    }
                  : null,
              })),
            }

            fastify.log.info(
              `[${sessionId}] Restoring AI memory with ${restoreData.steps.length} steps...`,
            )

            fastify.aiClientService
              .restoreMemory(restoreData, sessionId)
              .then(() => {
                fastify.log.info(
                  `[${sessionId}] AI memory restored successfully`,
                )
              })
              .catch((err) => {
                fastify.log.error(
                  err,
                  `[${sessionId}] Failed to restore AI memory`,
                )
              })
          }

          let currentQuestion: InterviewStep | null = null

          if (session.status === 'IN_PROGRESS') {
            // 진행 중인 경우, 답변이 없는 질문을 찾음 (메인/꼬리 모두 포함)
            currentQuestion = await fastify.prisma.interviewStep.findFirst({
              where: {
                interviewSessionId: sessionId,
                answer: null,
              },
              orderBy: {
                aiQuestionId: 'asc',
              },
            })
          } else if (session.status === 'READY') {
            // 준비 상태인 경우, 첫 번째 질문을 찾음
            currentQuestion = await fastify.prisma.interviewStep.findFirst({
              where: { interviewSessionId: sessionId },
              orderBy: { aiQuestionId: 'asc' },
            })
          }

          if (currentQuestion) {
            const readyTimer = createPerfTimer()
            const sttToken = await fastify.interviewService.generateSttToken(
              sessionId,
              socket.user.id,
            )
            readyTimer.lap('stt')

            const audioBase64 = await fastify.ttsService.generate(
              currentQuestion.question,
            )
            readyTimer.lap('tts')

            socket.emit('server:next-question', {
              step: currentQuestion,
              isFollowUp: !!currentQuestion.parentStepId, // 꼬리질문 여부 확인
              audioBase64,
              sttToken: sttToken.data.value,
            })
            fastify.log.info(
              `[${sessionId}] client:ready completed | perf: ${JSON.stringify(readyTimer.summary())}`,
            )
          }
          // 다른 상태(COMPLETED, FAILED 등)에서는 아무것도 보내지 않음
        } catch (error) {
          fastify.log.error(
            error,
            `Error handling client:ready for session ${sessionId}`,
          )
          socket.emit('server:error', {
            message: 'Failed to start or resume the interview.',
          })
        }
      })

      //file을 chunk 단위로 받은 후 해당 chunks를 모아 File 생성
      socket.uploadChunks = []

      socket.on(
        'client:upload-chunk',
        (p: { index: number; chunk: ArrayBuffer }) => {
          try {
            if (!p.chunk || !p.chunk.byteLength) {
              return socket.emit('server:error', {
                message: 'Invalid chunk data.',
              })
            }

            if (!socket.uploadChunks) socket.uploadChunks = []
            socket.uploadChunks[p.index] = Buffer.from(new Uint8Array(p.chunk))
          } catch (error) {
            fastify.log.error(
              error,
              `Error processing chunk ${p.index} for socket ${socket.id}`,
            )
            socket.emit('server:error', {
              message: 'Failed to process chunk.',
            })
          }
        },
      )

      socket.on(
        'client:upload-finish',
        async (p: { type: string; stepId: string }) => {
          try {
            if (!socket.uploadChunks || socket.uploadChunks.length === 0) {
              return socket.emit('server:error', {
                message: 'No chunks to process.',
              })
            }

            if (!p.stepId) {
              return socket.emit('server:error', {
                message: 'stepId is required for emotion analysis.',
              })
            }

            // 인덱스 누락 체크 & 정렬
            const ordered = socket.uploadChunks.filter(Boolean)
            if (ordered.length !== socket.uploadChunks.length) {
              fastify.log.warn(
                `Missing chunks detected for socket ${socket.id}. Expected: ${socket.uploadChunks.length}, Got: ${ordered.length}`,
              )
            }

            const big = Buffer.concat(ordered)
            const blob = new Blob([big], { type: p.type })
            const filename = `record-${crypto.randomUUID()}.${p.type.startsWith('video/mp4') ? 'mp4' : 'webm'}`
            const file = new File([blob], filename, {
              type: p.type,
              lastModified: Date.now(),
            })

            fastify.log.info(
              `[${socket.sessionId}] Video file created: ${filename} (${file.size} bytes)`,
            )
            socket.uploadChunks = [] // 메모리 해제

            // 감정 분석 요청
            if (!socket.sessionId) {
              throw new Error('Session ID not found in socket context.')
            }

            const uploadTimer = createPerfTimer()
            fastify.log.info(
              `[${socket.sessionId}] Starting emotion analysis for step ${p.stepId}...`,
            )
            const emotionResult = await fastify.aiClientService.analyzeEmotion(
              file,
              socket.sessionId,
            )
            uploadTimer.lap('emotion')

            // DB에 감정 분석 결과 저장
            await fastify.prisma.emotionAnalysis.create({
              data: {
                interviewStepId: p.stepId,
                frames: {
                  createMany: {
                    data: emotionResult.results.map((frame) => ({
                      frame: frame.frame,
                      time: frame.time,
                      happy: frame.happy,
                      sad: frame.sad,
                      neutral: frame.neutral,
                      angry: frame.angry,
                      fear: frame.fear,
                      surprise: frame.surprise,
                    })),
                  },
                },
              },
            })
            uploadTimer.lap('saveEmotion')

            fastify.log.info(
              `[${socket.sessionId}] upload-finish completed for step ${p.stepId} | perf: ${JSON.stringify(uploadTimer.summary())}`,
            )
          } catch (error) {
            fastify.log.error(
              error,
              `Error finalizing upload for socket ${socket.id}`,
            )
            socket.emit('server:error', {
              code: 'EMOTION_ANALYSIS_FAILED',
              message: 'Failed to analyze video emotion.',
            })
            socket.uploadChunks = [] // 에러 시에도 메모리 해제
          }
        },
      )

      socket.on(
        'client:submit-answer',
        async (payload: {
          stepId: string
          answer: string
          duration: number
          startAt: number
          endAt: number
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
              new Date(payload.startAt),
              new Date(payload.endAt),
            )
          } catch (error) {
            fastify.log.error(
              error,
              `Error processing answer for step ${payload.stepId}`,
            )
            socket.emit('server:error', {
              code: 'ANSWER_PROCESSING_FAILED',
              message: 'Failed to process your answer.',
            })
          }
        },
      )

      socket.on(
        'client:submit-elapsedSec',
        async ({
          sessionId,
          elapsedSec,
        }: {
          sessionId: string
          elapsedSec: number
        }) => {
          try {
            await fastify.prisma.interviewSession.update({
              where: { id: sessionId, userId: socket.user.id },
              data: { totalTimeSec: elapsedSec },
            })
          } catch (error) {
            fastify.log.error(
              error,
              `[${sessionId}] Failed to update elapsed time`,
            )
          }
        },
      )

      socket.on('disconnect', async () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`)

        // TTL 갱신 타이머 정리
        if (socket.ttlRefreshTimer) {
          clearTimeout(socket.ttlRefreshTimer)
          socket.ttlRefreshTimer = null
        }

        // 업로드 중이던 청크 정리
        if (socket.uploadChunks && socket.uploadChunks.length > 0) {
          fastify.log.warn(
            `Socket ${socket.id} disconnected with ${socket.uploadChunks.length} unfinished chunks. Clearing memory.`,
          )
          socket.uploadChunks = []
        }

        // 연결 종료 시에도 elapsedSec 업데이트 시도
        if (socket.sessionId) {
          // 이 부분은 클라이언트에서 보내주는 마지막 시간을 놓칠 경우를 대비
          // 클라이언트의 `disconnect` 핸들러에서 `emitElapsedSec`을 호출하는 것이 더 정확
        }
      })
    }

    fastify.io.on('connection', onConnection)

    fastify.addHook('onClose', async (instance) => {
      instance.io.close()
      if (pubClient) await pubClient.quit()
      if (subClient) await subClient.quit()
    })

    fastify.log.info('Socket.io plugin loaded')
  },
  {
    name: 'socket',
    dependencies: ['prisma', 'jwt', 'redis'],
  },
)
