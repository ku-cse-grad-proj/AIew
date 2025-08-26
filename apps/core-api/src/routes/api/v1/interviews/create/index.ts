import {
  FastifyPluginAsync,
  RouteHandler,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import { InterviewService } from '@/services/interview.service'
import { InterviewRequestBody } from '@/types/interview.types'
import SchemaId from '@/utils/schemaId'

const interviewsRoute: FastifyPluginAsync = async (fastify) => {
  const routePath = '/'

  const postOpts: RouteShorthandOptions = {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '새로운 AI 면접 세션 생성',
      description:
        '사용자로부터 회사, 직무, 자기소개서, 포트폴리오, 인재상 등의 정보를 받아 새로운 면접 세션을 생성하고,<br>' +
        '백그라운드에서 AI 질문 생성을 시작합니다.<br>' +
        '자기소개서와 포트폴리오는 PDF 파일만 업로드 가능합니다.<br><br>' +
        '**참고**: 실제 클라이언트가 보내야 하는 데이터 형식은 아래 테이블 참고<br>' +
        '<table>' +
        '<tr>' +
        '<td>이름</td>' +
        '<td>타입</td>' +
        '<td>필수</td>' +
        '<td>설명</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`company`</td>' +
        '<td>string</td>' +
        '<td>✅</td>' +
        '<td>회사명</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`jobTitle`</td>' +
        '<td>string</td>' +
        '<td>✅</td>' +
        '<td>직무명</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`jobSpec`</td>' +
        '<td>string</td>' +
        '<td>✅</td>' +
        '<td>세부 직무 기술</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`coverLetter`</td>' +
        '<td>file</td>' +
        '<td>✅</td>' +
        '<td>자기소개서 (PDF)</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`portfolio`</td>' +
        '<td>file</td>' +
        '<td>✅</td>' +
        '<td>포트폴리오 (PDF)</td>' +
        '</tr>' +
        '<tr>' +
        '<td>`idealTalent`</td>' +
        '<td>string</td>' +
        '<td>✅</td>' +
        '<td>회사의 인재상</td>' +
        '</tr>' +
        '</table>',
      consumes: ['multipart/form-data'],
      // TODO: Swagger에서 multipart/form-data를 제대로 표현하기 위한 추가 설정 필요
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

  const postHandler: RouteHandler = async (request, reply) => {
    const interviewService = new InterviewService(fastify)
    const body = {} as InterviewRequestBody
    const files: {
      coverLetter?: { buffer: Buffer; filename: string }
      portfolio?: { buffer: Buffer; filename: string }
    } = {}

    try {
      const parts = request.parts()
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.mimetype !== 'application/pdf') {
            // 스트림을 소비해야 에러가 전파되지 않음
            void part.file.resume()
            throw {
              statusCode: 415,
              message: `Unsupported Media Type: '${part.filename}'. Only PDF files are allowed.`,
            }
          }
          const buffer = await part.toBuffer()
          if (part.fieldname === 'coverLetter') {
            files.coverLetter = { buffer, filename: part.filename }
          } else if (part.fieldname === 'portfolio') {
            files.portfolio = { buffer, filename: part.filename }
          }
        } else {
          if (part.value) {
            const key = part.fieldname as keyof InterviewRequestBody
            body[key] = JSON.parse(part.value as string)
          }
        }
      }

      // 필수 파일 확인
      if (!files.coverLetter || !files.portfolio) {
        throw {
          statusCode: 400,
          message: 'Both coverLetter and portfolio files are required.',
        }
      }

      const session = await interviewService.createInterviewSession(
        request.user.userId,
        body,
        files as {
          coverLetter: { buffer: Buffer; filename: string }
          portfolio: { buffer: Buffer; filename: string }
        },
      )

      return reply.status(201).send({ sessionId: session.id })
    } catch (error) {
      fastify.log.error(error)
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number'
          ? error.statusCode
          : 500
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Internal Server Error'
      return reply.status(statusCode).send({ message })
    }
  }

  fastify.post(routePath, postOpts, postHandler)
}

export default interviewsRoute
