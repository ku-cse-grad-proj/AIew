import { FastifyPluginAsync, RouteHandler, RouteOptions } from 'fastify'

const controller: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /
   * 헬스체크 전용
   */
  const getHandler: RouteHandler = async (_request, reply) => {
    return reply.send({ message: 'Core API is running' })
  }

  const getOpts: RouteOptions = {
    method: 'GET',
    url: '/',
    handler: getHandler,
  }

  fastify.route(getOpts)
}

export default controller
