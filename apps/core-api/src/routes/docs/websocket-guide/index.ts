import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swaggerOption'
import SchemaId from '@/utils/schemaId'

const websocketDocsRoute: FastifyPluginAsync = async (fastify) => {
  const path: string = '/'
  const opts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Websocket],
      summary: 'AI 면접 WebSocket 통신 가이드',
      description:
        '<h2>AI 면접 WebSocket 통신 흐름 가이드</h2><br/>' +
        '이 문서는 AI 면접 기능의 WebSocket 통신 프로토콜을 설명합니다. **이 엔드포인트를 직접 호출하는 것이 아니라, 아래 명세에 따라 WebSocket 클라이언트를 구현해야 합니다.**<br/>' +
        '<h3>통신 순서</h3>' +
        '1.  **연결 수립**: 클라이언트는 `POST /api/v1/interviews/create` API를 호출하여 면접 세션을 생성하고 `sessionId`를 받습니다. Next.js와 같은 클라이언트 환경에서는 `socket.io-client` 라이브러리를 사용하여 서버에 연결합니다. 연결 시 `query` 옵션에 `sessionId`를 포함시켜야 합니다. <pre><code>const socket = io("http://localhost:3000", { query: { sessionId } });</code></pre>' +
        '2.  **질문 목록 수신**: 서버는 AI 질문 생성이 완료되면 `server:questions-ready` 메시지를 클라이언트로 전송합니다. 클라이언트는 이 메시지를 받아 전체 질문 목록을 화면에 표시할 수 있습니다.<br/>' +
        '3.  **답변 제출**: 사용자가 첫 번째 질문에 대한 답변을 마치면, 클라이언트는 `client:submit-answer` 메시지를 서버로 전송합니다. 이 메시지에는 현재 질문의 `stepId`, 사용자의 `answer` 내용, 그리고 답변에 소요된 `duration`(초)이 포함됩니다.<br/>' +
        '4.  **다음 질문 수신 또는 종료**: 서버는 제출된 답변을 처리한 후, 다음 질문이 있으면 `server:next-question` 메시지를 보냅니다. 모든 질문이 끝나면 `server:interview-finished` 메시지를 보냅니다. 꼬리 질문인 경우 `isFollowUp` 플래그가 `true`로 설정됩니다.<br/>' +
        '5.  **반복**: 클라이언트는 `server:interview-finished` 메시지를 받을 때까지 3,4번 과정을 반복합니다.<br/>' +
        '6.  **에러 처리**: 통신 중 문제가 발생하면 서버는 언제든지 `server:error` 메시지를 보낼 수 있습니다.<br/>',
      body: {
        description: '클라이언트가 서버로 보내는 메시지 (C2S)',
        $ref: SchemaId.WsClientSubmitAnswer,
      },
      response: {
        '200': {
          description: '서버가 클라이언트로 보내는 메시지 (S2C)',
          oneOf: [
            { $ref: SchemaId.WsServerQuestionsReady },
            { $ref: SchemaId.WsServerNextQuestion },
            { $ref: SchemaId.WsServerInterviewFinished },
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
