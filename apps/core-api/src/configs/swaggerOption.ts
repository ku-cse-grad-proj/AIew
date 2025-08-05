import { SwaggerOptions } from '@fastify/swagger'

const swaggerOption: SwaggerOptions = {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'AIew Swagger',
      description: '코딩 노예의 애환이 담긴 API 명세서',
      version: '0.0.1',
      contact: {
        email: 'skgudwls@konkuk.ac.kr',
        name: 'Backend Developer',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'AIew core-api 의 개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '"Bearer " prefix 사용 금지, accessToken만 입력',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}

enum Tag {
  DoNotExecute = '❌ 실행금지',
  Oauth = '🔐 OAuth2.0 (테스트 불가)',
  User = '👤 사용자',
  Interview = '🗣️ 면접',
  Report = '📜 결과 레포트',
  Unclassified = '🏷️ 나중에 태그 OR 삭제 예정',
  Websocket = '🛰️ WebSocket (테스트 불가)',
  Warning = '☢️ 테스트 전용',
}

export default swaggerOption
export { Tag, swaggerOption }
