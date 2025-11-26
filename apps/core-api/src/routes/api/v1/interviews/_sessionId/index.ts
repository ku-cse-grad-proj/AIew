import { MultipartFile, MultipartValue } from '@fastify/multipart'
import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import {
  S_InterviewSessionDeleteResponse,
  S_InterviewSessionItem,
  S_InterviewSessionPatchBody,
} from '@/schemas/rest/interview'
import SchemaId from '@/utils/schema-id'

// attachFieldsToBody: true 사용 시 PATCH body 타입
interface InterviewPatchMultipartBody {
  coverLetter?: MultipartFile
  portfolio?: MultipartFile
  title?: MultipartValue<string>
  company?: MultipartValue<string>
  jobTitle?: MultipartValue<string>
  jobSpec?: MultipartValue<string>
  idealTalent?: MultipartValue<string>
}

// PATCH /interviews/:sessionId body 스키마
const S_InterviewPatchMultipartBody = Type.Object({
  coverLetter: Type.Optional(
    Type.Any({
      isFile: true,
      description: '자기소개서 파일 (PDF)',
    }),
  ),
  portfolio: Type.Optional(
    Type.Any({
      isFile: true,
      description: '포트폴리오 파일 (PDF)',
    }),
  ),
  title: Type.Optional(Type.Any({ description: '면접 세션 제목' })),
  company: Type.Optional(Type.Any({ description: '회사명' })),
  jobTitle: Type.Optional(Type.Any({ description: '직무명' })),
  jobSpec: Type.Optional(Type.Any({ description: '세부 직무' })),
  idealTalent: Type.Optional(Type.Any({ description: '회사 인재상' })),
})

const controller: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance,
) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>()

  const C_Params = Type.Object({
    sessionId: Type.String({
      description: '면접 세션의 ID',
    }),
  })
  const C_ResErr = Type.Ref(SchemaId.Error)

  // --- GET /interviews/:sessionId ---
  server.route<{ Params: Static<typeof C_Params> }>({
    method: 'GET',
    url: '/',
    onRequest: [server.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '사용자가 생성한 단일 면접 세션 조회',
      description: '`sessionId`를 parameter로 받아와 일치하는 면접 세션 조회',
      params: C_Params,
      response: {
        200: S_InterviewSessionItem,
        '4XX': C_ResErr,
      },
    },
    handler: async (request, reply) => {
      const session = await server.interviewService.getInterviewSessionById(
        request.params.sessionId,
        request.user.userId,
      )

      if (!session) {
        return reply.notFound('Interview session not found.')
      }
      reply.send(session)
    },
  })

  // --- PATCH /interviews/:sessionId ---
  server.route<{
    Params: Static<typeof C_Params>
  }>({
    method: 'PATCH',
    url: '/',
    onRequest: [server.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '단일 면접 세션 수정',
      description:
        '`sessionId`에 해당하는 면접 세션의 정보를 수정합니다. **본인의 면접 세션만 수정할 수 있습니다.**',
      params: C_Params,
      consumes: ['multipart/form-data'],
      body: S_InterviewPatchMultipartBody,
      response: {
        200: S_InterviewSessionItem,
        403: C_ResErr,
        404: C_ResErr,
      },
    },
    handler: async (request, reply) => {
      const { sessionId } = request.params
      const { userId } = request.user

      // attachFieldsToBody: true 사용 시 body에서 직접 접근
      const multipartBody = request.body as InterviewPatchMultipartBody

      // 파일 처리
      const files: {
        coverLetter?: { buffer: Buffer; filename: string }
        portfolio?: { buffer: Buffer; filename: string }
      } = {}

      if (multipartBody.coverLetter) {
        if (multipartBody.coverLetter.mimetype !== 'application/pdf') {
          throw fastify.httpErrors.unsupportedMediaType(
            `Unsupported Media Type: '${multipartBody.coverLetter.filename}'. Only PDF files are allowed.`,
          )
        }
        files.coverLetter = {
          buffer: await multipartBody.coverLetter.toBuffer(),
          filename: multipartBody.coverLetter.filename,
        }
      }

      if (multipartBody.portfolio) {
        if (multipartBody.portfolio.mimetype !== 'application/pdf') {
          throw fastify.httpErrors.unsupportedMediaType(
            `Unsupported Media Type: '${multipartBody.portfolio.filename}'. Only PDF files are allowed.`,
          )
        }
        files.portfolio = {
          buffer: await multipartBody.portfolio.toBuffer(),
          filename: multipartBody.portfolio.filename,
        }
      }

      // 텍스트 필드 추출 (MultipartValue에서 value 추출 후 JSON 파싱)
      const body: Static<typeof S_InterviewSessionPatchBody> = {}
      if (multipartBody.title?.value) {
        body.title = JSON.parse(multipartBody.title.value)
      }
      if (multipartBody.company?.value) {
        body.company = JSON.parse(multipartBody.company.value)
      }
      if (multipartBody.jobTitle?.value) {
        body.jobTitle = JSON.parse(multipartBody.jobTitle.value)
      }
      if (multipartBody.jobSpec?.value) {
        body.jobSpec = JSON.parse(multipartBody.jobSpec.value)
      }
      if (multipartBody.idealTalent?.value) {
        body.idealTalent = JSON.parse(multipartBody.idealTalent.value)
      }

      const updatedSession =
        await server.interviewService.updateInterviewSession(
          sessionId,
          userId,
          body,
          files,
        )

      reply.send(updatedSession)
    },
  })

  // --- DELETE /interviews/:sessionId ---
  server.route<{ Params: Static<typeof C_Params> }>({
    method: 'DELETE',
    url: '/',
    onRequest: [server.authenticate],
    schema: {
      tags: [Tag.Interview],
      summary: '단일 면접 세션 삭제',
      description:
        '`sessionId`에 해당하는 면접 세션을 삭제합니다. **본인의 면접 세션만 삭제할 수 있습니다.**',
      params: C_Params,
      response: {
        200: S_InterviewSessionDeleteResponse,
        403: C_ResErr,
        404: C_ResErr,
      },
    },
    handler: async (request, reply) => {
      const { sessionId } = request.params
      const { userId } = request.user

      await server.interviewService.deleteInterviewSession(sessionId, userId)

      reply.send({ message: 'Interview session deleted successfully.' })
    },
  })
}

export default controller
