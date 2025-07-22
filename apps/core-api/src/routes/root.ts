import { FastifyPluginAsync } from 'fastify'

import { Tag } from '../configs/swaggerOption'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    { schema: { tags: [Tag.Unclassified] } },
    async function (req, reply) {
      reply.send({ root: true, message: 'Welcome to the API!' })
    },
  )
}

export default root
