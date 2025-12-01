import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import fp from 'fastify-plugin'

import { Tag } from './configs/swagger-option'

export type AppOptions = FastifyServerOptions & Partial<unknown>

/**
 * @description All app-level plugins & hooks should be registered here
 */
const app: FastifyPluginAsync<AppOptions> = async (fastify): Promise<void> => {
  // 플러그인으로 인해 자동 등록되는 oauth2 관련 routes 숨김처리
  fastify.addHook('onRoute', (routeOptions) => {
    if (
      routeOptions.path === '/api/v1/oauth2/google' ||
      routeOptions.path === '/api/v1/oauth2/github'
    ) {
      routeOptions.schema = {
        ...routeOptions.schema,
        tags: [Tag.Oauth],
        summary: '각 OAuth 서비스 제공사에 등록된 Route',
      }
    }
  })
}

export default fp(app)
export { app }
