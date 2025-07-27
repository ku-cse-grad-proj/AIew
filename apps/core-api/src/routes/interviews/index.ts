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
      try {
        const questions = {
          technical: ['Tell me about REST API.', 'What is WebSocket?'],
          personality: ['What are your strengths?'],
          tailored: ['Why do you want to work at our company?'],
        }
        await fastify.prisma.interviewSession.update({
          where: { id: session.id },
          data: { questions },
        })
        fastify.io.to(session.id).emit('server:questions-ready', { questions })
      } catch (error) {
        fastify.log.error(error)
        fastify.io.to(session.id).emit('server:error', {
          code: 'AI_GENERATION_FAILED',
          message: 'Failed to generate interview questions.',
        })
      }
    }
    askAIForQuestions()

    reply.status(201).send({ sessionId: session.id })
  }

  fastify.post(routePath, postOpts, postHandler)
}

export default fp(interviewsRoute)
