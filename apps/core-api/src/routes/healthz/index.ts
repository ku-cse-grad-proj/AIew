import { FastifyPluginAsync, RouteHandler, RouteOptions } from 'fastify'

const controller: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * GET /healthz
   * Docker 헬스체크 전용 (logLevel: 'silent'로 로그 노이즈 제거)
   */
  const getHandler: RouteHandler = async (_request, reply) => {
    return reply.send({ status: 'ok' })
  }

  const getOpts: RouteOptions = {
    method: 'GET',
    url: '/',
    logLevel: 'silent',
    handler: getHandler,
  }

  fastify.route(getOpts)
}

export default controller
