import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '../../../../configs/swaggerOption'
import SchemaId from '../../../../utils/schemaId'

const pump = promisify(pipeline)

// request.body에 추가될 필드들의 타입을 정의합니다.
interface InterviewRequestBody {
  company: { value: string }
  jobTitle: { value: string }
  jobSpec: { value: string }
  idealTalent: { value: string }
}

const interviewsRoute: FastifyPluginAsync = async (fastify) => {
  const routePath = '/'

  const postOpts: RouteShorthandOptions = {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '새로운 AI 면접 세션 생성',
      description:
        '사용자로부터 회사, 직무, 자기소개서, 포트폴리오, 인재상 등의 정보를 받아 새로운 면접 세션을 생성하고,<br>\
        백그라운드에서 AI 질문 생성을 시작합니다.<br>\
        자기소개서와 포트폴리오는 PDF 파일만 업로드 가능합니다.<br><br>\
        **참고**: 실제 클라이언트가 보내야 하는 데이터 형식은 아래 테이블 참고<br>\
        <table>\
          <tr>\
            <td>이름</td>\
            <td>타입</td>\
            <td>필수</td>\
            <td>설명</td>\
          </tr>\
          <tr>\
            <td>`company`</td>\
            <td>string</td>\
            <td>✅</td>\
            <td>회사명</td>\
          </tr>\
          <tr>\
            <td>`jobTitle`</td>\
            <td>string</td>\
            <td>✅</td>\
            <td>직무명</td>\
          </tr>\
          <tr>\
            <td>`jobSpec`</td>\
            <td>string</td>\
            <td>✅</td>\
            <td>세부 직무 기술</td>\
          </tr>\
          <tr>\
            <td>`coverLetter`</td>\
            <td>file</td>\
            <td>✅</td>\
            <td>자기소개서 (PDF)</td>\
          </tr>\
          <tr>\
            <td>`portfolio`</td>\
            <td>file</td>\
            <td>✅</td>\
            <td>포트폴리오 (PDF)</td>\
          </tr>\
          <tr>\
            <td>`idealTalent`</td>\
            <td>string</td>\
            <td>✅</td>\
            <td>회사의 인재상</td>\
          </tr>\
        </table>',
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          company: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
              },
            },
          },
          jobTitle: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
              },
            },
          },
          jobSpec: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
              },
            },
          },
          coverLetter: { isFile: true },
          portfolio: { isFile: true },
          idealTalent: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
              },
            },
          },
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
        '415': {
          description:
            '지원되지 않는 파일 형식입니다. PDF 파일만 업로드할 수 있습니다.',
          $ref: `${SchemaId.Error}#`,
        },
      },
    },
  }

  const postHandler: RouteHandlerMethod = async (request, reply) => {
    const uploadDir = path.join(__dirname, '../../../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    let coverLetterPath: string | undefined
    let portfolioPath: string | undefined

    try {
      const files = request.files()
      for await (const part of files) {
        if (part.mimetype !== 'application/pdf') {
          throw {
            statusCode: 415,
            message: `Unsupported Media Type: '${part.filename}'. Only PDF files are allowed.`,
          }
        }

        const uniqueFilename = `${randomUUID()}-${part.filename}`
        const filePath = path.join(uploadDir, uniqueFilename)
        await pump(part.file, fs.createWriteStream(filePath))

        if (part.fieldname === 'coverLetter') {
          coverLetterPath = filePath
        } else if (part.fieldname === 'portfolio') {
          portfolioPath = filePath
        }
      }
    } catch (error) {
      fastify.log.error(error)

      let statusCode = 500
      let message = 'An error occurred during file processing.'
      let errorType = 'Internal Server Error'

      // unknown 타입의 에러를 안전하게 처리하기 위한 타입 가드
      if (typeof error === 'object' && error !== null) {
        if ('statusCode' in error && typeof error.statusCode === 'number') {
          statusCode = error.statusCode
        }
        if ('message' in error && typeof error.message === 'string') {
          message = error.message
        }
        if (statusCode === 415) {
          errorType = 'Unsupported Media Type'
        }
      }

      return reply.status(statusCode).send({
        statusCode,
        error: errorType,
        message,
      })
    }

    // attachFieldsToBody 옵션 덕분에 request.body에서 필드 값을 직접 사용 가능
    const { company, jobTitle, jobSpec, idealTalent } =
      request.body as InterviewRequestBody

    const session = await fastify.prisma.interviewSession.create({
      data: {
        userId: request.user.userId,
        company: company.value,
        jobTitle: jobTitle.value,
        jobSpec: jobSpec.value,
        idealTalent: idealTalent.value,
        coverLetter: coverLetterPath,
        portfolio: portfolioPath,
      },
    })

    const askAIForQuestions = async () => {
      /*
       * TODO: 프로덕션 확장성 고려
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
        fastify.io.to(session.id).emit('server:questions-ready', { questions })
      } catch (error) {
        fastify.log.error(error)
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

export default interviewsRoute
