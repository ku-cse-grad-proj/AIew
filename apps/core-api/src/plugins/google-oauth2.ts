import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { GetObjectCommand } from '@aws-sdk/client-s3'
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}

interface GoogleOAuthCredentials {
  web?: {
    client_id: string
    client_secret: string
    redirect_uris?: string[]
  }
}

async function loadGoogleOAuthCredentials(
  fastify: FastifyInstance,
): Promise<{ clientId: string; clientSecret: string } | null> {
  const { r2, log } = fastify
  const bucket = process.env.R2_BUCKET_NAME
  const key = process.env.GOOGLE_OAUTH_R2_KEY

  // R2 키가 없으면 환경변수에서 직접 읽기 (로컬 개발용)
  if (!key) {
    log.info(
      'GOOGLE_OAUTH_R2_KEY not set. Using environment variables directly.',
    )
    return {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  }

  const tempFilePath = path.join(os.tmpdir(), `google-oauth-${Date.now()}.json`)

  try {
    log.info(`Downloading Google OAuth credentials from R2: ${bucket}/${key}`)
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const response = await r2.send(command)

    if (!response.Body) {
      throw new Error('Downloaded OAuth credential file is empty.')
    }

    const fileContent = await response.Body.transformToByteArray()
    await fs.writeFile(tempFilePath, fileContent)

    // JSON 파일 파싱
    const credentialsJson = await fs.readFile(tempFilePath, 'utf-8')
    const credentials: GoogleOAuthCredentials = JSON.parse(credentialsJson)

    // web 타입에서 credentials 추출
    const oauthConfig = credentials.web
    if (!oauthConfig) {
      throw new Error('Invalid OAuth credentials format. Expected "web" key.')
    }

    log.info('Google OAuth credentials loaded from R2 successfully.')

    // Cleanup 등록
    fastify.addHook('onClose', async () => {
      try {
        await fs.unlink(tempFilePath)
        log.info(`Cleaned up temporary OAuth credential file: ${tempFilePath}`)
      } catch (cleanupError) {
        log.error(
          'Error cleaning up temporary OAuth credential file:',
          cleanupError,
        )
      }
    })

    return {
      clientId: oauthConfig.client_id,
      clientSecret: oauthConfig.client_secret,
    }
  } catch (error) {
    log.error('FATAL: Failed to load Google OAuth credentials from R2.', error)
    // Cleanup on error
    try {
      await fs.unlink(tempFilePath)
    } catch {}
    process.exit(1)
  }
}

const googleOAuth2Plugin: FastifyPluginAsync = async (fastify) => {
  const credentials = await loadGoogleOAuthCredentials(fastify)

  if (!credentials) {
    fastify.log.error('Google OAuth credentials not available.')
    return
  }

  const redirectPath: string = '/api/v1/oauth2/google'
  const callbackPath: string = `${redirectPath}/callback`

  fastify.register(oauthPlugin, {
    name: 'googleOAuth2', // 이 이름으로 자동으로 decorate 됨
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: credentials.clientId,
        secret: credentials.clientSecret,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: redirectPath,
    callbackUri: `${process.env.OAUTH_CALLBACK_BASE_URL}${callbackPath}`,
  })

  fastify.log.info('Google OAuth2 플러그인 등록 성공 ✅')
}

export default fp(googleOAuth2Plugin, {
  name: 'googleOAuth2',
  dependencies: ['r2'],
})
