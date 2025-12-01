import { withAccelerate } from '@prisma/extension-accelerate'
import fp from 'fastify-plugin'

import { PrismaClient } from '@/generated/prisma/client'

// withAccelerate 확장 적용 후 타입
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

function createPrismaClient() {
  const accelerateUrl = process.env.DATABASE_URL
  if (!accelerateUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  return new PrismaClient({
    accelerateUrl,
  }).$extends(withAccelerate())
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: ExtendedPrismaClient
  }
}

export default fp(
  async (fastify) => {
    const prisma = createPrismaClient()

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async () => {
      await prisma.$disconnect()
    })
  },
  {
    name: 'prisma',
  },
)
