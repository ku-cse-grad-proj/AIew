import { S3Client } from '@aws-sdk/client-s3'
import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })
  fastify.decorate('r2', s3Client)
})

declare module 'fastify' {
  export interface FastifyInstance {
    r2: S3Client
  }
}
