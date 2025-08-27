import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schemaId'

export const interviewSchema = Type.Object(
  {
    id: Type.String({
      description: '면접 세션의 고유 ID',
      example: 'clxxtkv0w0000a4z0b1c2d3e4',
    }),
    company: Type.String({
      description: '회사명',
      example: 'Awesome Inc.',
    }),
    jobTitle: Type.String({
      description: '직무명',
      example: 'Software Engineer',
    }),
    jobSpec: Type.String({
      description: '세부 직무',
      example: 'Backend Developer',
    }),
    currentQuestionIndex: Type.Number({
      description: '현재 진행 중인 질문의 인덱스 (0부터 시작)',
      example: 0,
    }),
    createdAt: Type.String({
      format: 'date-time',
      description: '생성 일시',
    }),
    updatedAt: Type.String({
      format: 'date-time',
      description: '마지막 업데이트 일시',
    }),
  },
  { $id: SchemaId.Interview },
)
