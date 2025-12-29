import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Type, Static } from '@sinclair/typebox'
import axios from 'axios'
import { FastifySchema, RouteHandler, RouteOptions } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsyncTypebox = async (fastify) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const GoogleUserInfo = Type.Object({
    email: Type.String(),
    name: Type.String(),
    picture: Type.String(),
  })

  const Res302 = Type.Object(
    {},
    {
      description:
        '인증 성공 시 프론트엔드 콜백 URL로 리디렉션됩니다. 모든 토큰은 안전한 HttpOnly 쿠키에 담겨 응답됩니다.',
      headers: Type.Object({
        Location: Type.String({
          description: '리디렉션될 프론트엔드 URL',
          format: 'uri',
          example: 'http://localhost:4000/auth/callback',
        }),
      }),
    },
  )

  // 4xx/5xx 에러 응답을 위한 스키마 (기존 스키마 재사용)
  const ResErr = Type.Ref(SchemaId.Error)

  const getHandler: RouteHandler = async (request, reply) => {
    try {
      // Google OAuth2 토큰 획득
      const { token: googleToken } =
        await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request,
        )

      // Google 사용자 정보 가져오기
      const { data: userInfo } = await axios.get<Static<typeof GoogleUserInfo>>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${googleToken.access_token}`,
          },
        },
      )

      server.log.info(
        `Google OAuth user info received: ${userInfo.email} (${userInfo.name})`,
      )

      // AuthService를 통해 OAuth 로그인 처리 (사용자 생성 또는 조회 + JWT 발급)
      const { accessToken, refreshToken } =
        await server.authService.handleOAuthLogin(userInfo.email, {
          name: userInfo.name,
          pic_url: userInfo.picture,
          provider: 'GOOGLE',
        })

      // JWT를 HttpOnly 쿠키에 담아 프론트엔드로 리디렉션
      reply
        .setCookie('accessToken', accessToken, {
          path: '/',
          httpOnly: true, // 클라이언트 측 js가 확인할 수 없게됨
          secure: process.env.NODE_ENV === 'production', // 프로덕션에서는 true로 설정
          sameSite: 'lax', // CSRF 공격 차단 + 정상적인 요청에서는 GET 허용
          maxAge: 15 * 60, // 15분 (초 단위)
        })
        .setCookie('refreshToken', refreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7일
        })
        .redirect(`${process.env.API_BASE_URL}/auth/callback`)
    } catch (error) {
      server.log.error(error)
      reply.redirect(`${process.env.API_BASE_URL}/login-failed`)
    }
  }

  const getSchema: FastifySchema = {
    tags: [Tag.Oauth],
    summary: '구글 OAuth2.0 콜백',
    description:
      '구글 인증 성공 후, 서버에서 사용자 정보를 처리하고 인증 토큰(accessToken, refreshToken)을 HttpOnly 쿠키에 설정합니다.<br/>' +
      '성공 시 프론트엔드의 콜백 URL로 리디렉션됩니다.',
    response: {
      302: Res302,
      '4xx': ResErr,
      '5xx': ResErr,
    },
  }

  // 로그인 도중이므로 onRequest 훅으로 authenticate 진행하지 않음
  const getOpts: RouteOptions = {
    method: 'GET',
    url: '/',
    handler: getHandler,
    schema: getSchema,
  }

  server.route(getOpts)
}

export default controller
