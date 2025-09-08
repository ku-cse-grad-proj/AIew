import { InterviewSessionStatus } from '@prisma/client'
import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

// --- Reusable Properties ---
const InterviewSessionProperties = {
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
    example: '토스뱅크',
  }),
  jobTitle: Type.String({
    description: '직무명',
    example: 'Web developer',
  }),
  jobSpec: Type.String({
    description: '세부 직무',
    example: 'Backend',
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
    example: '2025-08-27T12:34:56Z',
  }),
  updatedAt: Type.String({
    format: 'date-time',
    description: '마지막 업데이트 일시',
    example: '2025-08-27T12:34:56Z',
  }),
}

// --- GET /interviews/:sessionId ---
// 단일 면접 세션 상세 정보 (나중에 steps 등을 포함하여 확장 가능)
export const S_InterviewSessionItem = Type.Object(InterviewSessionProperties, {
  $id: SchemaId.InterviewSessionItem,
})

// --- GET /interviews ---
// 면접 세션 목록
export const S_InterviewSessionList = Type.Array(
  Type.Object(InterviewSessionProperties),
  { $id: SchemaId.InterviewSessionList },
)

// --- PATCH /interviews/:sessionId ---
// 면접 세션 정보 수정을 위한 요청 본문
export const S_InterviewSessionPatchBody = Type.Object(
  {
    title: Type.Optional(Type.String({ description: '면접 세션 제목' })),
    company: Type.Optional(Type.String({ description: '회사명' })),
    jobTitle: Type.Optional(Type.String({ description: '직무명' })),
    jobSpec: Type.Optional(Type.String({ description: '세부 직무' })),
    idealTalent: Type.Optional(Type.String({ description: '회사 인재상' })),
  },
  { $id: SchemaId.InterviewSessionPatchBody },
)

// --- DELETE /interviews/:sessionId ---
// 면접 세션 삭제 응답
export const S_InterviewSessionDeleteResponse = Type.Object(
  {
    message: Type.String({
      example: 'Interview session deleted successfully.',
    }),
  },
  { $id: SchemaId.InterviewSessionDeleteResponse },
)
