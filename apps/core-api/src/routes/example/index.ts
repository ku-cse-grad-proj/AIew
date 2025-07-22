import { FastifyPluginAsync } from 'fastify'

import { Tag } from '../../configs/swaggerOption'

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    {
      schema: {
        tags: [Tag.Unclassified],
      },
    },
    async function () {
      return 'this is an example'
    },
  )
}

export default example
