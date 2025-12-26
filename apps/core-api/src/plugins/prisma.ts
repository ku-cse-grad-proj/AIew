import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import fp from 'fastify-plugin'

import { PrismaClient } from '@/generated/prisma/client'

// Accelerate 확장 클라이언트 타입 (프로덕션 기준)
function createAccelerateClient(url: string) {
  return new PrismaClient({
    accelerateUrl: url,
  }).$extends(withAccelerate())
}

type ExtendedPrismaClient = ReturnType<typeof createAccelerateClient>

function createPrismaClient(): ExtendedPrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Accelerate URL (prisma+postgres://)인지 확인
  const isAccelerateUrl = databaseUrl.startsWith('prisma+postgres://')

  if (isAccelerateUrl) {
    // 프로덕션: Accelerate 사용 (캐싱, 커넥션 풀링)
    return createAccelerateClient(databaseUrl)
  } else {
    // 로컬/테스트: driver adapter로 직접 PostgreSQL 연결
    const adapter = new PrismaPg({ connectionString: databaseUrl })
    return new PrismaClient({ adapter }) as unknown as ExtendedPrismaClient
  }
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
