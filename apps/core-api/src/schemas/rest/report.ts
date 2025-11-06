import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

// --- Query Parameters ---
export const S_ReportsQueryParams = Type.Object(
  {
    title: Type.Optional(
      Type.String({
        description: '검색할 리포트 타이틀',
        example: '삼성',
      }),
    ),
    company: Type.Optional(
      Type.String({
        description: '검색할 회사명',
        example: '네이버',
      }),
    ),
    from: Type.Optional(
      Type.String({
        format: 'date',
        description: '검색 시작일 (포함)',
        example: '2025-01-01',
      }),
    ),
    to: Type.Optional(
      Type.String({
        format: 'date',
        description: '검색 종료일 (포함)',
        example: '2025-12-31',
      }),
    ),
    job: Type.Optional(
      Type.Union([Type.Literal('web'), Type.Literal('app')], {
        description: '직무 구분',
        example: 'web',
      }),
    ),
    detailJob: Type.Optional(
      Type.Union([Type.Literal('front'), Type.Literal('back')], {
        description: '세부 직무 구분',
        example: 'front',
      }),
    ),
    page: Type.Optional(
      Type.Number({
        minimum: 1,
        description: '현재 페이지 번호',
        example: 1,
      }),
    ),
    sort: Type.Optional(
      Type.String({
        description: '정렬 기준 및 방향 (형식: {필드명}-{asc|desc})',
        example: 'title-desc',
      }),
    ),
  },
  { $id: SchemaId.ReportsQueryParams },
)

// --- Report Item ---
export const S_ReportItem = Type.Object(
  {
    id: Type.String({
      description: '리포트 고유 ID (InterviewSession ID)',
      example: 'clxxtkv0w0000a4z0b1c2d3e4',
    }),
    title: Type.String({
      description: '리포트 제목',
      example: '배달의민족 interview',
    }),
    company: Type.String({
      description: '회사명',
      example: '배달의민족',
    }),
    jobTitle: Type.Union([Type.Literal('web'), Type.Literal('app')], {
      description: '상위 직무 구분',
      example: 'web',
    }),
    jobSpec: Type.Union([Type.Literal('front'), Type.Literal('back')], {
      description: '세부 직무 구분',
      example: 'front',
    }),
    date: Type.String({
      format: 'date',
      description: '면접 날짜',
      example: '2025-09-14',
    }),
    score: Type.Number({
      description: '평균 점수 (소수 1자리)',
      example: 3.8,
    }),
    duration: Type.Number({
      description: '면접 소요 시간 (분)',
      example: '52',
    }),
  },
  { $id: SchemaId.ReportItem },
)

// --- GET /api/v1/reports ---
export const S_ReportsResponse = Type.Array(S_ReportItem, {
  $id: SchemaId.ReportsResponse,
  description: '페이지별 리포트 목록 (최대 10개)',
  minItems: 0,
  maxItems: 10,
})

// --- GET /api/v1/reports/pages/count ---
export const S_ReportsPagesCountResponse = Type.Number({
  $id: SchemaId.ReportsPagesCountResponse,
  description: '전체 데이터 기준 총 페이지 수 (10개 단위)',
  example: 23,
  minimum: 0,
})

// --- GET /api/v1/reports/summary ---
export const S_ReportsSummaryResponse = Type.Object(
  {
    totalReports: Type.Number({
      description: '전체 리포트 개수',
      example: 223,
    }),
    averageScore: Type.Number({
      description: '평균 점수 (소수 1자리 반올림)',
      example: 3.7,
    }),
    averageDuration: Type.Number({
      description: '평균 소요 시간 (분)',
      example: 48,
    }),
    mostFrequentCompany: Type.String({
      description: '가장 많이 등장한 회사명',
      example: '배달의 민족',
    }),
  },
  { $id: SchemaId.ReportsSummaryResponse },
)
