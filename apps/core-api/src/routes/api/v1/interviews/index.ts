import { MultipartFile, MultipartValue } from '@fastify/multipart'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_InterviewSessionList } from '@/schemas/rest/interview'
import { InterviewRequestBody } from '@/types/interview.types'
import SchemaId from '@/utils/schema-id'

// attachFieldsToBody: true 사용 시 body 타입
interface InterviewMultipartBody {
  coverLetter?: MultipartFile
  portfolio?: MultipartFile
  company?: MultipartValue<string>
  jobTitle?: MultipartValue<string>
  jobSpec?: MultipartValue<string>
  idealTalent?: MultipartValue<string>
}

// POST /interviews body 스키마
const S_InterviewPostBody = Type.Object({
  coverLetter: Type.Any({
    isFile: true,
    description: '자기소개서 파일 (PDF)',
  }),
  portfolio: Type.Any({
    isFile: true,
    description: '포트폴리오 파일 (PDF)',
  }),
  company: Type.String({
    description: '회사 정보 (JSON 문자열)',
  }),
  jobTitle: Type.String({
    description: '직무명 (JSON 문자열)',
  }),
  jobSpec: Type.String({
    description: '세부 직무 (JSON 문자열)',
  }),
  idealTalent: Type.String({
    description: '회사 인재상 (JSON 문자열)',
  }),
})

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /interviews
  const getSchema: FastifySchema = {
    tags: [Tag.Interview],
    summary: '사용자가 생성한 모든 면접 세션 목록 조회',
    description:
      '사용자가 생성한 면접 세션들 중 완료되지 않은 모든 세션을 반환합니다.',
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
    body: S_InterviewPostBody,
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

    try {
      // attachFieldsToBody: true 사용 시 body에서 직접 접근
      const multipartBody = request.body as InterviewMultipartBody

      // 파일 검증 및 추출
      const coverLetterFile = multipartBody.coverLetter
      const portfolioFile = multipartBody.portfolio

      if (!coverLetterFile || !portfolioFile) {
        throw fastify.httpErrors.badRequest(
          'Both coverLetter and portfolio files are required.',
        )
      }

      // PDF 타입 검증
      if (coverLetterFile.mimetype !== 'application/pdf') {
        throw fastify.httpErrors.unsupportedMediaType(
          `Unsupported Media Type: '${coverLetterFile.filename}'. Only PDF files are allowed.`,
        )
      }
      if (portfolioFile.mimetype !== 'application/pdf') {
        throw fastify.httpErrors.unsupportedMediaType(
          `Unsupported Media Type: '${portfolioFile.filename}'. Only PDF files are allowed.`,
        )
      }

      // 파일 버퍼 추출
      const files = {
        coverLetter: {
          buffer: await coverLetterFile.toBuffer(),
          filename: coverLetterFile.filename,
        },
        portfolio: {
          buffer: await portfolioFile.toBuffer(),
          filename: portfolioFile.filename,
        },
      }

      // 텍스트 필드 추출 (MultipartValue에서 value 추출 후 JSON 파싱)
      const body: InterviewRequestBody = {
        company: JSON.parse(multipartBody.company?.value || '{}'),
        jobTitle: JSON.parse(multipartBody.jobTitle?.value || '{}'),
        jobSpec: JSON.parse(multipartBody.jobSpec?.value || '{}'),
        idealTalent: JSON.parse(multipartBody.idealTalent?.value || '{}'),
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
        files,
      )
    } catch (error) {
      fastify.log.error({ error }, `[${request.id}] Error in postHandler`)
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
