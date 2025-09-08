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
      response: {
        200: S_InterviewSessionItem,
        403: C_ResErr,
        404: C_ResErr,
      },
    },
    handler: async (request, reply) => {
      const { sessionId } = request.params
      const { userId } = request.user

      const body = {} as Static<typeof S_InterviewSessionPatchBody>
      const files: {
        coverLetter?: { buffer: Buffer; filename: string }
        portfolio?: { buffer: Buffer; filename: string }
      } = {}

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
            const key = part.fieldname as keyof Static<
              typeof S_InterviewSessionPatchBody
            >
            body[key] = JSON.parse(part.value as string)
          }
        }
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
