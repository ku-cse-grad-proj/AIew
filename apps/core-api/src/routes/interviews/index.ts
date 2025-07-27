import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { FastifyPluginAsync, RouteHandlerMethod } from 'fastify'
import fp from 'fastify-plugin'

import { Tag } from '../../configs/swaggerOption'

const pump = promisify(pipeline)

interface MultipartFields {
  company: string
  jobTitle: string
  jobSpec: string
  idealTalent?: string
  coverLetterPath?: string
  portfolioPath?: string
}

const interviewsRoute: FastifyPluginAsync = async (fastify) => {
  const routePath = '/interviews'

  const postOpts = {
    schema: {
      tags: [Tag.Interview],
      summary: '새로운 AI 면접 세션 생성',
      description:
        '사용자로부터 회사, 직무, 자기소개서, 포트폴리오, 인재상 등의 정보를 받아 새로운 면접 세션을 생성하고, 백그라운드에서 AI 질문 생성을 시작합니다.',
      body: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          jobTitle: { type: 'string' },
          jobSpec: { type: 'string' },
          coverLetter: { type: 'string', format: 'binary' },
          portfolio: { type: 'string', format: 'binary' },
          idealTalent: { type: 'string' },
        },
        required: [
          'company',
          'jobTitle',
          'jobSpec',
          'coverLetter',
          'portfolio',
          'idealTalent',
        ],
      },
      response: {
        '201': {
          description: '성공적으로 면접 세션이 생성되었습니다.',
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: '생성된 면접 세션의 고유 ID',
            },
          },
        },
      },
    },
  }

  const postHandler: RouteHandlerMethod = async (request, reply) => {
    const parts = request.parts()
    const fields: Partial<MultipartFields> = {}
    const uploadDir = path.join(__dirname, '../../../uploads')

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    try {
      for await (const part of parts) {
        if (part.type === 'file') {
          const uniqueFilename = `${randomUUID()}-${part.filename}`
          const filePath = path.join(uploadDir, uniqueFilename)
          await pump(part.file, fs.createWriteStream(filePath))
          if (part.fieldname === 'coverLetter') {
            fields.coverLetterPath = filePath
          } else if (part.fieldname === 'portfolio') {
            fields.portfolioPath = filePath
          }
        } else {
          // This is a field
          fields[part.fieldname as keyof MultipartFields] = part.value as string
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ message: 'File upload failed' })
    }

    const {
      company,
      jobTitle,
      jobSpec,
      idealTalent,
      coverLetterPath,
      portfolioPath,
    } = fields

    if (!company || !jobTitle || !jobSpec) {
      return reply.status(400).send({ message: 'Missing required fields' })
    }

    const session = await fastify.prisma.interviewSession.create({
      data: {
        userId: request.user.userId,
        company,
        jobTitle,
        jobSpec,
        idealTalent,
        coverLetter: coverLetterPath,
        portfolio: portfolioPath,
      },
    })

    const askAIForQuestions = async () => {
      /*
       * [TODO] 프로덕션 확장성 고려
       * 현재 구현은 core-api 서버가 단일 인스턴스일 때만 정상 동작합니다.
       * 서버가 여러 대로 확장(scale-out)될 경우, HTTP 요청을 받은 서버와
       * WebSocket 연결을 유지 중인 서버가 다를 수 있어 클라이언트에게
       * 결과를 전달하지 못하는 문제가 발생합니다.
       *
       * 이를 해결하기 위해 프로덕션 환경에서는 다음과 같은 아키텍처를 권장합니다:
       * 1. (현재 서버) AI 질문 생성 요청 데이터를 RabbitMQ나 Kafka 같은 메시지 브로커의
       *    '질문 생성 작업' 큐(토픽)에 발행(publish)합니다.
       * 2. ai-server는 해당 큐를 구독(subscribe)하여 작업을 가져가 처리합니다.
       * 3. 작업 완료 후, ai-server는 결과를 '질문 생성 결과' 큐에 발행합니다.
       * 4. 모든 core-api 인스턴스는 '질문 생성 결과' 큐를 구독하고 있다가,
       *    결과 메시지를 받으면 Socket.io의 어댑터(예: Redis Adapter)를 통해
       *    올바른 클라이언트에게 결과를 전송합니다.
       */
      try {
        // 3. (백그라운드 작업) AI 서버에 질문 생성 요청
        //    현재는 임시로 HTTP 직접 호출을 시뮬레이션합니다.
        // const questions = await aiServer.generateQuestions(...)
        const questions = {
          technical: ['Tell me about REST API.', 'What is WebSocket?'],
          personality: ['What are your strengths?'],
          tailored: ['Why do you want to work at our company?'],
        }

        // 4. AI 서버로부터 받은 질문을 DB에 업데이트
        await fastify.prisma.interviewSession.update({
          where: { id: session.id },
          data: { questions },
        })

        // 5. 해당 세션의 WebSocket '방(room)'에 있는 클라이언트에게 알림
        //    TODO: session.id를 방 이름으로 사용하여 특정 클라이언트에게만 보내도록 수정 필요
        fastify.io.to(session.id).emit('server:questions-ready', { questions })
      } catch (error) {
        fastify.log.error(error)
        // TODO: session.id를 방 이름으로 사용하여 특정 클라이언트에게만 보내도록 수정 필요
        fastify.io.to(session.id).emit('server:error', {
          code: 'AI_GENERATION_FAILED',
          message: 'Failed to generate interview questions.',
        })
      }
    }
    askAIForQuestions() // 비동기 함수를 호출하고 기다리지 않습니다.

    reply.status(201).send({ sessionId: session.id })
  }

  fastify.post(routePath, postOpts, postHandler)
}

export default fp(interviewsRoute)
