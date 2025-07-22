import { FastifyPluginAsync } from 'fastify'

import { Tag } from '../configs/swaggerOption'

const ping: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/ping', { schema: { tags: [Tag.Unclassified] } }, async () => {
    return { msg: 'pong' }
  })
}

export default ping
