import { InterviewSessionStatus } from '@prisma/client'
import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schemaId'

// GET /api/v1/interviews 응답의 각 항목에 대한 스키마
export const interviewListItemSchema = Type.Object(
  {
    id: Type.String({
      description: '면접 세션의 고유 ID',
      example: 'clxxtkv0w0000a4z0b1c2d3e4',
    }),
    title: Type.String({
      description: '면접 세션 제목',
      example: '네이버 interview 1',
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
    status: Type.Enum(InterviewSessionStatus, {
      description: '면접 세션의 현재 상태',
      example: 'READY',
    }),
    currentQuestionIndex: Type.Number({
      description: '현재 진행 중인 질문의 인덱스 (0부터 시작)',
      example: 0,
    }),
    idealTalent: Type.Optional(
      Type.String({
        description: '회사 인재상',
        example: '열정적이고 협업을 잘하는 개발자',
      }),
    ),
    coverLetterFilename: Type.Optional(
      Type.String({
        description: '제출된 자기소개서 파일명',
        example: 'my_cover_letter.pdf',
      }),
    ),
    portfolioFilename: Type.Optional(
      Type.String({
        description: '제출된 포트폴리오 파일명',
        example: 'my_portfolio.pdf',
      }),
    ),
    createdAt: Type.String({
      format: 'date-time',
      description: '생성 일시',
    }),
    updatedAt: Type.String({
      format: 'date-time',
      description: '마지막 업데이트 일시',
    }),
  },
  { $id: SchemaId.InterviewListItem },
)

// GET /api/v1/interviews 응답 전체에 대한 스키마
export const interviewListSchema = Type.Array(interviewListItemSchema, {
  $id: SchemaId.InterviewList,
})
