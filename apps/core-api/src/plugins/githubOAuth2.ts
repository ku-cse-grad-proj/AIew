import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    githubOAuth2: OAuth2Namespace
  }
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
}

export default fp(githubOAuth2Plugin)
