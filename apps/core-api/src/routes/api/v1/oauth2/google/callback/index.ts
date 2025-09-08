import { SignPayloadType } from '@fastify/jwt'
import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Type, Static } from '@sinclair/typebox'
import axios from 'axios'
import { FastifySchema, RouteHandler } from 'fastify'

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

  const handler: RouteHandler = async (request, reply) => {
    try {
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

      server.log.info(userInfo)

      // DB에서 사용자 조회 또는 생성
      let user = await server.prisma.user.findUnique({
        where: { email: userInfo.email },
      })

      if (!user) {
        user = await server.prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name,
            pic_url: userInfo.picture,
            provider: 'GOOGLE',
          },
        })
      }

      // 사용자를 위한 JWT 생성
      const payload: SignPayloadType = { userId: user.id }
      const accessToken: string = await reply.jwtSign(payload, {
        expiresIn: '15m',
      })
      const refreshToken: string = await reply.jwtSign(payload, {
        expiresIn: '7d',
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
        .redirect('http://localhost:4000/auth/callback')
    } catch (error) {
      server.log.error(error)
      reply.redirect('http://localhost:4000/login-failed')
    }
  }

  const schema: FastifySchema = {
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

  server.route({
    method: 'GET',
    url: '/',
    handler,
    schema,
  })
}

export default controller
