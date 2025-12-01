import { FastifyPluginAsync, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { S_ReportDetailResponse } from '@/schemas/rest'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/reports/{id}
  const getSchema: FastifySchema = {
    tags: [Tag.Report],
    summary: '리포트 상세 정보 조회',
    description:
      '특정 완료된 면접 세션의 상세 리포트를 조회합니다. 인터뷰 정보, 메트릭, 피드백을 포함합니다.',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '리포트 ID (InterviewSession ID)' },
      },
      required: ['id'],
    },
    response: {
      200: S_ReportDetailResponse,
      400: {
        description: '세션이 COMPLETED 상태가 아님',
        $ref: SchemaId.Error,
      },
      401: { description: '인증 실패', $ref: SchemaId.Error },
      403: { description: '권한 없음', $ref: SchemaId.Error },
      404: { description: '리포트를 찾을 수 없음', $ref: SchemaId.Error },
    },
  }

  const getHandler: RouteHandler<{
    Params: { id: string }
  }> = async (request, reply) => {
    const { id } = request.params
    const { userId } = request.user

    const reportDetail = await fastify.reportService.getReportDetail(id, userId)

    reply.send(reportDetail)
  }

  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: getSchema,
    handler: getHandler,
  })
}

export default controller
