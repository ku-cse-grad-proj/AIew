import { SignPayloadType } from '@fastify/jwt'
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2'
import axios from 'axios'
import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'
import fp from 'fastify-plugin'

import { Tag } from '@/configs/swaggerOption'

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}

interface GoogleUserInfo {
  email: string
  name: string
  picture: string
}

const googleOAuth2Plugin: FastifyPluginAsync = async (fastify) => {
  const redirectPath: string = '/api/v1/oauth2/google'
  const callbackPath: string = `${redirectPath}/callback`

  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID as string,
        secret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: redirectPath,
    callbackUri: `http://localhost:3000${callbackPath}`, // 127.0.0.1 에서 시도시 실패
    callbackUriParams: {},
    cookie: {
      secure: false, // 개발 환경에서는 false로 설정
    },
  })

  const opts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Oauth],
      summary: '구글 OAuth2.0 콜백',
      description:
        '구글 인증 성공 후, 서버에서 사용자 정보를 처리하고 인증 토큰(accessToken, refreshToken)을 HttpOnly 쿠키에 설정합니다.<br/>' +
        '성공 시 프론트엔드의 콜백 URL로 리디렉션됩니다.',
      response: {
        '302': {
          description:
            '인증 성공 시 프론트엔드 콜백 URL로 리디렉션됩니다. 모든 토큰은 안전한 HttpOnly 쿠키에 담겨 응답됩니다.',
          headers: {
            Location: {
              description: '리디렉션될 프론트엔드 URL',
              type: 'string',
              format: 'uri',
              example: 'http://localhost:4000/auth/callback',
            },
          },
        },
        '4XX': {
          description:
            '**로그인 실패시**<br>' +
            '`http:localhost:4000/login-failed` 로 redirect',
          headers: {
            Location: {
              description: '리디렉션될 프론트엔드 URL',
              type: 'string',
              format: 'uri',
              example: 'http://localhost:4000/login-failed',
            },
          },
        },
      },
    },
  }

  const handler: RouteHandlerMethod = async (req, reply) => {
    try {
      const { token: googleToken } =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)

      // Google 사용자 정보 가져오기
      const { data: userInfo } = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${googleToken.access_token}`,
          },
        },
      )

      console.log(userInfo)

      // DB에서 사용자 조회 또는 생성
      let user = await fastify.prisma.user.findUnique({
        where: { email: userInfo.email },
      })

      if (!user) {
        user = await fastify.prisma.user.create({
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
      fastify.log.error(error)
      // 실패 시 에러 메시지와 함께 프론트엔드로 리디렉션할 수도 있습니다.
      reply.redirect('http://localhost:4000/login-failed')
    }
  }

  fastify.get(callbackPath, opts, handler)
}

export default fp(googleOAuth2Plugin)
