import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { GetObjectCommand } from '@aws-sdk/client-s3'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

async function setupGoogleCredentials(fastify: FastifyInstance) {
  const { r2, log } = fastify
  const bucket = process.env.R2_BUCKET_NAME!
  const key = process.env.GOOGLE_CREDS_R2_KEY!
  const tempFilePath = path.join(os.tmpdir(), `google-creds-${Date.now()}.json`)

  try {
    log.info(`Downloading Google credentials from R2: ${bucket}/${key}`)
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const response = await r2.send(command)

    if (!response.Body) {
      throw new Error('Downloaded credential file is empty.')
    }

    const fileContent = await response.Body.transformToByteArray()
    await fs.writeFile(tempFilePath, fileContent)

    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath
    log.info(`Google credentials set to temporary file: ${tempFilePath}`)

    fastify.addHook('onClose', async () => {
      try {
        await fs.unlink(tempFilePath)
        log.info(`Cleaned up temporary credential file: ${tempFilePath}`)
      } catch (cleanupError) {
        log.error(cleanupError, 'Error cleaning up temporary credential file')
      }
    })
  } catch (error) {
    log.error(error, 'FATAL: Failed to setup Google credentials from R2.')
    process.exit(1)
  }
}

export default fp(
  async (fastify) => {
    if (process.env.GOOGLE_CREDS_R2_KEY) {
      await setupGoogleCredentials(fastify)
      fastify.log.info('@google-cloud/text-to-speech 계정 연결 성공 ✅')
    } else {
      fastify.log.warn(
        'GOOGLE_CREDS_R2_KEY not set. Skipping Google credentials setup from R2. ' +
          'Assuming local ADC is configured.',
      )
    }
  },
  {
    name: 'googleTTSAuth',
    dependencies: ['r2'],
  },
)
