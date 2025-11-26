import { Type } from '@sinclair/typebox'

import { InterviewSessionStatus } from '@/generated/prisma/client'
import SchemaId from '@/utils/schema-id'

// 사용자 정보
export const S_DashboardUserInfos = Type.Object(
  {
    name: Type.String({ description: '사용자 이름' }),
    mostJobTitle: Type.String({
      description: '가장 많이 진행한 직무',
      example: 'web',
    }),
    mostJobSpec: Type.String({
      description: '가장 많이 진행한 세부 직무',
      example: 'front',
    }),
    profileImg: Type.String({ description: '프로필 이미지 경로 또는 URL' }),
    interviewCount: Type.Number({
      description: '총 완료한 인터뷰 수',
      minimum: 0,
    }),
    averageScore: Type.Number({
      description: '평균 점수 (0~5, 소수 1자리)',
      minimum: 0,
      maximum: 5,
    }),
  },
  { $id: SchemaId.DashboardUserInfos },
)

// 최근 인터뷰
export const S_DashboardInterview = Type.Object(
  {
    id: Type.String({ description: '인터뷰 세션 ID' }),
    status: Type.Union(
      [
        Type.Literal(InterviewSessionStatus.IN_PROGRESS),
        Type.Literal(InterviewSessionStatus.READY),
      ],
      { description: '인터뷰 상태' },
    ),
    title: Type.String({ description: '인터뷰 제목' }),
    company: Type.String({ description: '회사명' }),
    jobTitle: Type.String({ description: '직무' }),
    jobSpec: Type.String({ description: '세부 직무' }),
  },
  { $id: SchemaId.DashboardInterview },
)

// 최근 리포트 항목
export const S_DashboardReportItem = Type.Object(
  {
    id: Type.String({ description: '리포트 ID (InterviewSession ID)' }),
    title: Type.String({ description: '리포트 제목' }),
    jobTitle: Type.String({ description: '직무' }),
    jobSpec: Type.String({ description: '세부 직무' }),
    finishDate: Type.String({
      format: 'date',
      description: '면접 완료 날짜 (YYYY-MM-DD)',
    }),
  },
  { $id: SchemaId.DashboardReportItem },
)

// 메인 대시보드 응답
export const S_DashboardResponse = Type.Object(
  {
    userInfos: S_DashboardUserInfos,
    interview: Type.Union([S_DashboardInterview, Type.Null()], {
      description: '가장 최근에 접근한 인터뷰 (없으면 null)',
    }),
    reports: Type.Array(S_DashboardReportItem, {
      description: '최근 완료된 리포트 (최대 2개)',
      maxItems: 2,
    }),
  },
  { $id: SchemaId.DashboardResponse, description: '대시보드 메인 데이터' },
)

// 라인 그래프 데이터
export const S_DashboardLineGraphResponse = Type.Object(
  {
    labels: Type.Array(Type.String(), {
      description: '인터뷰 타이틀 배열 (최대 10개)',
      maxItems: 10,
    }),
    scores: Type.Array(Type.Number({ minimum: 0, maximum: 5 }), {
      description: '각 인터뷰의 평균 점수 배열',
      maxItems: 10,
    }),
    durations: Type.Array(Type.Number({ minimum: 0 }), {
      description: '각 인터뷰의 소요 시간 배열 (분)',
      maxItems: 10,
    }),
  },
  {
    $id: SchemaId.DashboardLineGraphResponse,
    description: '최근 인터뷰 추이 그래프 데이터',
  },
)

// 회사별 그래프 데이터
export const S_DashboardCompanyGraphResponse = Type.Object(
  {
    labels: Type.Array(Type.String(), {
      description: '회사명 배열 (최대 6개, Others 포함 가능)',
      maxItems: 6,
    }),
    counts: Type.Array(Type.Number({ minimum: 0 }), {
      description: '각 회사별 인터뷰 횟수 배열',
      maxItems: 6,
    }),
  },
  {
    $id: SchemaId.DashboardCompanyGraphResponse,
    description: '회사별 인터뷰 분포 그래프 데이터',
  },
)
