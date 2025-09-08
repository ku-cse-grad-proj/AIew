import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_InterviewSessionList } from '@/schemas/rest/interview'
import { InterviewRequestBody } from '@/types/interview.types'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /interviews
  const getSchema: FastifySchema = {
    tags: [Tag.Interview],
    summary: '사용자가 생성한 모든 면접 세션 목록 조회',
    description: '사용자가 생성한 면접 세션들의 목록을 반환합니다.',
    response: {
      200: S_InterviewSessionList,
    },
  }

  const getHandler: RouteHandler = async (request, reply) => {
    const interviews = await fastify.interviewService.getUserInterviews(
      request.user.userId,
    )
    reply.send(interviews)
  }

  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: getSchema,
    handler: getHandler,
  })

  // POST /interviews
  const postSchema: FastifySchema = {
    tags: [Tag.Interview],
    summary: '새로운 AI 면접 세션 생성',
    description:
      '사용자로부터 면접 정보를 받아 세션을 즉시 생성하고 sessionId를 반환합니다.<br>' +
      '파일 업로드 및 AI 질문 생성은 백그라운드에서 비동기적으로 처리되며, 완료 시 WebSocket으로 클라이언트에게 알림을 보냅니다.<br>' +
      '자기소개서와 포트폴리오는 PDF 파일만 업로드 가능합니다.',
    consumes: ['multipart/form-data'],
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
      '400': {
        description: '필수 파일이 누락되었거나 잘못된 요청입니다.',
        $ref: SchemaId.Error,
      },
      '415': {
        description:
          '지원되지 않는 파일 형식입니다. PDF 파일만 업로드할 수 있습니다.',
        $ref: SchemaId.Error,
      },
    },
  }

  const postHandler: RouteHandler = async (request, reply) => {
    const { interviewService } = fastify
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
            throw fastify.httpErrors.unsupportedMediaType(
              `Unsupported Media Type: '${part.filename}'. Only PDF files are allowed.`,
            )
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
        throw fastify.httpErrors.badRequest(
          'Both coverLetter and portfolio files are required.',
        )
      }

      // 면접 세션 초기화 및 즉시 응답
      const session = await interviewService.initializeSession(
        request.user.userId,
        body,
      )
      reply.status(201).send({ sessionId: session.id })

      // 응답을 보낸 후, 백그라운드에서 무거운 작업 처리
      // (주의: 이 방식은 서버가 종료되면 백그라운드 작업이 유실될 수 있음
      // 프로덕션 환경에서는 별도의 Job Queue(예: BullMQ, RabbitMQ) 사용 권장)
      void interviewService.processInterviewInBackground(
        session.id,
        body,
        files as {
          coverLetter: { buffer: Buffer; filename: string }
          portfolio: { buffer: Buffer; filename: string }
        },
      )
    } catch (error) {
      fastify.log.error(`[${request.id}] Error in postHandler:`, { error })
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500
      const message =
        (error as { message?: string }).message ?? 'Internal Server Error'
      // reply가 이미 전송된 경우를 대비하여 체크
      if (!reply.sent) {
        reply.status(statusCode).send({ message })
      }
    }
  }

  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: postSchema,
    handler: postHandler,
  })
}
export default controller
