import fastifyRedis from '@fastify/redis'
import fp from 'fastify-plugin'

export default fp(
  async (fastify) => {
    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      fastify.log.warn('REDIS_URL not configured, skipping Redis connection')
      return
    }

    await fastify.register(fastifyRedis, {
      url: redisUrl,
      closeClient: true,
    })

    // 연결 테스트
    try {
      const pong = await fastify.redis.ping()
      fastify.log.info(`Redis connected: ${pong}`)
    } catch (err) {
      fastify.log.error(err, 'Redis connection failed')
    }
  },
  {
    name: 'redis',
  },
)
