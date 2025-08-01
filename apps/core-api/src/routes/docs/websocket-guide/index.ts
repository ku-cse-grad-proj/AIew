import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '../../../configs/swaggerOption'
import SchemaId from '../../../utils/schemaId'

const websocketDocsRoute: FastifyPluginAsync = async (fastify) => {
  const path: string = '/'
  const opts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Websocket],
      summary: 'AI 면접 WebSocket 통신 가이드',
      description:
        '## AI 면접 WebSocket 통신 흐름 가이드\n\n' +
        '이 문서는 AI 면접 기능의 WebSocket 통신 프로토콜을 설명합니다. **이 엔드포인트를 직접 호출하는 것이 아니라, 아래 명세에 따라 WebSocket 클라이언트를 구현해야 합니다.**\n\n' +
        '### 통신 순서\n' +
        '1. 클라이언트는 `POST /interviews` API를 호출하여 면접 세션을 생성하고 `sessionId`를 받습니다.\n' +
        '2. 클라이언트는 받은 `sessionId`를 사용하여 `ws://localhost:3000/interviews/{sessionId}` 경로로 WebSocket 연결을 수립합니다.\n' +
        '3. 서버는 AI 질문 생성이 완료되면 `server:questions-ready` 메시지를 클라이언트로 전송합니다.\n' +
        '4. 클라이언트는 면접을 시작할 준비가 되면 `client:ready` 메시지를 서버로 전송합니다.\n' +
        '5. (이후 음성 데이터 전송 및 피드백 수신 등의 통신이 이어집니다.)\n',
      body: {
        description: '클라이언트가 서버로 보내는 메시지 (C2S)',
        $ref: SchemaId.WsClientReady,
      },
      response: {
        '200': {
          description: '서버가 클라이언트로 보내는 메시지 (S2C)',
          oneOf: [
            { $ref: SchemaId.WsServerQuestionsReady },
            { $ref: SchemaId.WsServerError },
          ],
        },
      },
    },
  }
  const handler: RouteHandlerMethod = async (request, reply) => {
    reply.status(405).send({
      error: 'Method Not Allowed',
      message:
        'This endpoint is for documentation purposes only and should not be called directly.',
    })
  }

  // 이 라우트는 문서화 목적으로만 존재하며, 실제 로직은 없습니다.
  fastify.post(path, opts, handler)
}

export default websocketDocsRoute
