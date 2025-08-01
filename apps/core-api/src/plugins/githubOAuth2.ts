import { SignPayloadType } from '@fastify/jwt'
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2'
import axios from 'axios'
import {
  FastifyPluginAsync,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from 'fastify'
import fp from 'fastify-plugin'

import { Tag } from '../configs/swaggerOption'

declare module 'fastify' {
  interface FastifyInstance {
    githubOAuth2: OAuth2Namespace
  }
}

interface GitHubUserInfo {
  id: number
  login: string
  name: string
  email: string | null
}

interface GitHubEmailInfo {
  email: string
  primary: boolean
  verified: boolean
  visibility: 'public' | 'private' | null
}

const githubOAuth2Plugin: FastifyPluginAsync = async (fastify) => {
  const redirectPath: string = '/api/v1/oauth2/github'
  const callbackPath: string = `${redirectPath}/callback`

  fastify.register(oauthPlugin, {
    name: 'githubOAuth2',
    scope: ['read:user', 'user:email'], // GitHub는 사용자 정보와 이메일을 위해 별도의 scope가 필요합니다.
    credentials: {
      client: {
        id: process.env.GITHUB_CLIENT_ID as string,
        secret: process.env.GITHUB_CLIENT_SECRET as string,
      },
      auth: oauthPlugin.GITHUB_CONFIGURATION,
    },
    startRedirectPath: redirectPath,
    callbackUri: `http://localhost:3000${callbackPath}`,
  })

  const opts: RouteShorthandOptions = {
    schema: {
      tags: [Tag.Oauth],
      summary: '깃허브 OAuth2.0 콜백',
      description:
        'OAuth 2.0으로 Provider의 access token을 받아옴<br/>' +
        '이를 Provider의 api 서버에 보내 사용자의 이메일과 이름 받아옴<br/>' +
        'email, name, provider로 새로운 사용자를 생성하고<br/>' +
        '이 때 sqlite가 자동생성한 id로 JWT 생성<br/>' +
        'jwt의 `accessToken`은 프론트/auth/callback 의 쿼리로, `refreshToken`은 쿠키에 담아 리턴',
      response: {
        '302': {
          description:
            '인증 성공 시 프론트엔드 콜백 URL로 리디렉션됩니다. accessToken이 쿼리 파라미터에 포함됩니다.',
          headers: {
            Location: {
              description: '리디렉션될 프론트엔드 URL',
              type: 'string',
              format: 'uri',
              example:
                'http://localhost:4000/auth/callback?accessToken=eyJhbGciOiJI...',
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
      const { token } =
        await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)

      const { data: userInfo } = await axios.get<GitHubUserInfo>(
        'https://api.github.com/user',
        {
          headers: { Authorization: `Bearer ${token.access_token}` },
        },
      )

      let userEmail = userInfo.email
      // 사용자의 주 이메일이 비공개인 경우, 이메일 목록에서 가져옵니다.
      if (!userEmail) {
        const { data: emails } = await axios.get<GitHubEmailInfo[]>(
          'https://api.github.com/user/emails',
          {
            headers: { Authorization: `Bearer ${token.access_token}` },
          },
        )
        userEmail =
          emails.find((email) => email.primary && email.verified)?.email ?? null
      }

      if (!userEmail) {
        throw new Error('GitHub user email could not be retrieved.')
      }

      // DB에서 사용자 조회 또는 생성
      let user = await fastify.prisma.user.findUnique({
        where: { email: userEmail },
      })

      if (!user) {
        user = await fastify.prisma.user.create({
          data: {
            email: userEmail,
            name: userInfo.name || userInfo.login,
            provider: 'GITHUB',
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

      // JWT를 쿠키에 담아 프론트엔드로 리디렉션
      reply
        .setCookie('refresh_token', refreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // 프로덕션에서는 true로 설정
          sameSite: 'lax', // CSRF 공격 차단 + 정상적인 요청에서는 GET 허용
        })
        .redirect(
          `http://localhost:4000/auth/callback?accessToken=${accessToken}`,
        ) // AccessToken은 쿼리로 전달
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ message: 'GitHub login failed' })
    }
  }

  fastify.get(callbackPath, opts, handler)
}

export default fp(githubOAuth2Plugin)
