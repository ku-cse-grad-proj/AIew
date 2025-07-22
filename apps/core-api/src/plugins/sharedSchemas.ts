import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import * as schemas from '../schemas'

const sharedSchemasPlugin: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  for (const schema of Object.values(schemas)) {
    fastify.addSchema(schema)
  }
}

export default fp(sharedSchemasPlugin)
