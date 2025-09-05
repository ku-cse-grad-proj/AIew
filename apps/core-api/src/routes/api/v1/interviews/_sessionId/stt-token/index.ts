import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import axios from 'axios'
import { FastifyInstance, RequestGenericInterface, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

const controller: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance,
) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>()

  const Params = Type.Object({
    sessionId: Type.String({
      description: '진행중인 면접 세션의 ID',
    }),
  })

  const Res201 = Type.Object({
    data: Type.Object({
      value: Type.String(),
    }),
  })
  const ResErr = Type.Ref(SchemaId.Error)

  interface requestGeneric extends RequestGenericInterface {
    Params: Static<typeof Params>
  }

  const handler: RouteHandler<requestGeneric> = async (request, reply) => {
    const { sessionId } = request.params
    const { userId } = request.user

    try {
      // 세션 소유권 확인
      const session = await server.prisma.interviewSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Interview session with ID '${sessionId}' not found.`,
        })
      }

      if (session.userId !== userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You are not authorized to access this interview session.',
        })
      }

      //session 설정
      //turn_detection: semantic_vad가 가장 좋은 성능을 보임
      const sessionConfig = {
        session: {
          type: 'transcription',
          audio: {
            input: {
              transcription: {
                model: 'gpt-4o-transcribe',
                language: 'ko',
              },
              turn_detection: {
                type: 'semantic_vad',
              },
            },
          },
        },
      }

      // 소유권이 확인되면 토큰 발급 진행
      const response = await axios.post<Static<typeof Res201>>(
        'https://api.openai.com/v1/realtime/client_secrets',
        sessionConfig,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )
      //EPHEMERAL_KEY 값인 data.value를 반환.
      return reply.status(201).send(response)
    } catch (error) {
      server.log.error(error, 'Failed to get token from OpenAI.')
      if (axios.isAxiosError(error) && error.response) {
        return reply.status(error.response.status).send({
          statusCode: error.response.status,
          error: error.name,
          message: error.response.data?.error?.message || error.message,
        })
      }
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred.',
      })
    }
  }

  server.route<requestGeneric>({
    method: 'get',
    url: '/',
    onRequest: [server.authenticate],
    handler: handler,
    schema: {
      tags: [Tag.Interview],
      summary: 'OpenAI STT 임시 토큰 발급',
      description:
        'Next.js 클라이언트가 OpenAI의 Realtime Transcription API와 WebRTC 연결을 맺기 위해 필요한 임시 토큰(ephemeral token)을 발급합니다.<br/>' +
        '**해당 면접 세션을 생성한 사용자만 토큰을 발급받을 수 있습니다.**',
      params: Params,
      response: {
        201: Res201,
        '403': ResErr,
        '404': ResErr,
        '5xx': ResErr,
      },
    },
  })
}

export default controller
