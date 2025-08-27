import ISchema from '@/schemas/rest/interface'
import SchemaId from '@/utils/schemaId'

export const interviewSchema: ISchema = {
  $id: SchemaId.Interview,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: '면접 세션의 고유 ID',
      example: 'clxxtkv0w0000a4z0b1c2d3e4',
    },
    company: {
      type: 'string',
      description: '회사명',
      example: 'Awesome Inc.',
    },
    jobTitle: {
      type: 'string',
      description: '직무명',
      example: 'Software Engineer',
    },
    jobSpec: {
      type: 'string',
      description: '세부 직무',
      example: 'Backend Developer',
    },
    currentQuestionIndex: {
      type: 'number',
      description: '현재 진행 중인 질문의 인덱스 (0부터 시작)',
      example: 0,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: '생성 일시',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: '마지막 업데이트 일시',
    },
  },
}
