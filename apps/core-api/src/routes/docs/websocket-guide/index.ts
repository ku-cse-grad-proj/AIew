import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'
import SchemaId from '@/utils/schema-id'

const websocketDocsRoute: FastifyPluginAsync = async (fastify) => {
  const path: string = '/'
  const opts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Websocket],
      summary: 'AI 면접 WebSocket 통신 가이드',
      description:
        '<h2>AI 면접 WebSocket 통신 흐름 가이드 (TTS 포함)</h2><br/>' +
        '이 문서는 AI 면접 기능의 WebSocket 통신 프로토콜을 설명합니다. **이 엔드포인트를 직접 호출하는 것이 아니라, 아래 명세에 따라 WebSocket 클라이언트를 구현해야 합니다.**<br/>' +
        '<h3>통신 순서</h3>' +
        '1.  **연결 수립**: 클라이언트는 `HttpOnly` 쿠키에 `accessToken`을 담아 서버에 WebSocket 연결을 시도합니다. <pre><code>const socket = io("http://localhost:3000", { withCredentials: true });</code></pre>' +
        '2.  **방 참여**: 연결이 성공하면, 클라이언트는 `POST /api/v1/interviews`를 통해 받은 `sessionId`를 사용하여 `client:join-room` 메시지를 서버로 보냅니다.<br/>' +
        '3.  **질문(텍스트) 목록 수신**: 서버는 AI 질문 생성이 완료되면 `server:questions-ready` 메시지를 클라이언트로 전송합니다. 클라이언트는 이 메시지를 받아 전체 질문 목록(텍스트)을 미리 준비할 수 있습니다.<br/>' +
        '4.  **첫 질문 음성 수신**: 서버는 3번 메시지 직후, 첫 번째 질문에 대한 음성 파일(Base64)을 `server:question-audio-ready` 메시지로 클라이언트에게 보냅니다. 클라이언트는 이 음성을 받아 재생할 준비를 합니다.<br/>' +
        '5.  **답변 제출**: 사용자가 질문에 대한 답변을 마치면, 클라이언트는 `client:submit-answer` 메시지를 서버로 전송합니다. 이 메시지에는 현재 질문의 `stepId`, 사용자의 `answer` 내용, 그리고 답변에 소요된 `duration`(초)이 포함됩니다.<br/>' +
        '6.  **다음 질문(텍스트+음성) 수신 또는 종료**: 서버는 제출된 답변을 처리한 후, 다음 질문이 있으면 텍스트와 음성(Base64)을 함께 담아 `server:next-question` 메시지를 보냅니다. 모든 질문이 끝나면 `server:interview-finished` 메시지를 보냅니다. 꼬리 질문인 경우 `isFollowUp` 플래그가 `true`로 설정됩니다.<br/>' +
        '7.  **반복**: 클라이언트는 `server:interview-finished` 메시지를 받을 때까지 5,6번 과정을 반복합니다.<br/>' +
        '8.  **에러 처리**: 통신 중 문제가 발생하면 서버는 언제든지 `server:error` 메시지를 보낼 수 있습니다.<br/>',
      body: {
        description: '클라이언트가 서버로 보내는 메시지 (C2S)',
        $ref: SchemaId.WsClientSubmitAnswer,
      },
      response: {
        '200': {
          description: '서버가 클라이언트로 보내는 메시지 (S2C)',
          oneOf: [
            { $ref: SchemaId.WsServerQuestionsReady },
            { $ref: SchemaId.WsServerQuestionAudioReady },
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
