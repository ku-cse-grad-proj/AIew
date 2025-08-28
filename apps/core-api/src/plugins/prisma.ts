import { PrismaClient } from '@prisma/client'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(
  async (fastify) => {
    const prisma = new PrismaClient()

    await prisma.$connect()

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async (fastify) => {
      await fastify.prisma.$disconnect()
    })
  },
  {
    name: 'prisma',
  },
)
