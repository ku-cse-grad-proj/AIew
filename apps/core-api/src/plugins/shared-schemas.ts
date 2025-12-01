import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import * as restSchemas from '@/schemas/rest'
import * as wsSchemas from '@/schemas/ws'

const sharedSchemasPlugin: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // REST API 스키마 등록
  for (const schema of Object.values(restSchemas)) {
    fastify.addSchema(schema)
  }
  // WebSocket 스키마 등록
  for (const schema of Object.values(wsSchemas)) {
    // 인터페이스나 타입 별칭은 스키마 객체가 아니므로 건너뜁니다.
    if (typeof schema === 'object' && schema !== null && '$id' in schema) {
      fastify.addSchema(schema)
    }
  }
}

export default fp(sharedSchemasPlugin)
