import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}

const googleOAuth2Plugin: FastifyPluginAsync = async (fastify) => {
  const redirectPath: string = '/api/v1/oauth2/google'
  const callbackPath: string = `${redirectPath}/callback`

  fastify.register(oauthPlugin, {
    name: 'googleOAuth2', // 이 이름으로 자동으로 decorate 됨
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
  })
}

export default fp(googleOAuth2Plugin)
