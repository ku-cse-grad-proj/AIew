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
import { FileAction } from '@/types/interview.types'
import SchemaId from '@/utils/schema-id'

// attachFieldsToBody: true 사용 시 PATCH body 타입
interface InterviewPatchMultipartBody {
  coverLetter?: MultipartFile
  portfolio?: MultipartFile
  coverLetterAction?: MultipartValue<FileAction>
  portfolioAction?: MultipartValue<FileAction>
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
  coverLetterAction: Type.Optional(
    Type.Any({
      description:
        '자기소개서 파일 액션 (keep: 유지, upload: 새 파일 업로드, delete: 삭제)',
    }),
  ),
  portfolioAction: Type.Optional(
    Type.Any({
      description:
        '포트폴리오 파일 액션 (keep: 유지, upload: 새 파일 업로드, delete: 삭제)',
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
        const coverLetterBuffer = await multipartBody.coverLetter.toBuffer()
        if (coverLetterBuffer.length === 0) {
          throw fastify.httpErrors.badRequest(
            `Empty file: '${multipartBody.coverLetter.filename}'. Please upload a valid PDF file.`,
          )
        }
        files.coverLetter = {
          buffer: coverLetterBuffer,
          filename: multipartBody.coverLetter.filename,
        }
      }

      if (multipartBody.portfolio) {
        if (multipartBody.portfolio.mimetype !== 'application/pdf') {
          throw fastify.httpErrors.unsupportedMediaType(
            `Unsupported Media Type: '${multipartBody.portfolio.filename}'. Only PDF files are allowed.`,
          )
        }
        const portfolioBuffer = await multipartBody.portfolio.toBuffer()
        if (portfolioBuffer.length === 0) {
          throw fastify.httpErrors.badRequest(
            `Empty file: '${multipartBody.portfolio.filename}'. Please upload a valid PDF file.`,
          )
        }
        files.portfolio = {
          buffer: portfolioBuffer,
          filename: multipartBody.portfolio.filename,
        }
      }

      // 파일 액션 추출 (기본값: keep)
      const fileActions = {
        coverLetter: (multipartBody.coverLetterAction?.value ??
          'keep') as FileAction,
        portfolio: (multipartBody.portfolioAction?.value ??
          'keep') as FileAction,
      }

      // 액션 유효성 검증
      const validActions: FileAction[] = ['keep', 'upload', 'delete']
      if (!validActions.includes(fileActions.coverLetter)) {
        throw fastify.httpErrors.badRequest(
          `Invalid coverLetterAction: '${fileActions.coverLetter}'. Must be one of: ${validActions.join(', ')}`,
        )
      }
      if (!validActions.includes(fileActions.portfolio)) {
        throw fastify.httpErrors.badRequest(
          `Invalid portfolioAction: '${fileActions.portfolio}'. Must be one of: ${validActions.join(', ')}`,
        )
      }

      // coverLetter는 현재 필수이므로 delete 불가
      if (fileActions.coverLetter === 'delete') {
        throw fastify.httpErrors.badRequest(
          'Cannot delete cover letter. Cover letter is required.',
        )
      }

      // upload 액션인데 파일이 없으면 에러
      if (fileActions.coverLetter === 'upload' && !files.coverLetter) {
        throw fastify.httpErrors.badRequest(
          'coverLetterAction is "upload" but no coverLetter file provided.',
        )
      }
      if (fileActions.portfolio === 'upload' && !files.portfolio) {
        throw fastify.httpErrors.badRequest(
          'portfolioAction is "upload" but no portfolio file provided.',
        )
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
          fileActions,
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
