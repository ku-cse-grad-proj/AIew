import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

// 리포트 상세 - 인터뷰 정보
export const S_ReportDetailInterviewInfo = Type.Object(
  {
    title: Type.String({ description: '면접 세션 제목' }),
    jobTitle: Type.String({ description: '직무' }),
    jobSpec: Type.String({ description: '세부 직무' }),
    coverLetterFilename: Type.String({ description: '자기소개서 파일명' }),
    portfolioFilename: Type.String({ description: '포트폴리오 파일명' }),
    idealTalent: Type.Union([Type.String(), Type.Null()], {
      description: '이상적 인재상',
    }),
  },
  { $id: SchemaId.ReportDetailInterviewInfo },
)

// 리포트 상세 - 메트릭 정보
export const S_ReportDetailMetricsInfo = Type.Object(
  {
    score: Type.Number({
      description: '전체 평균 점수 (0~5)',
      minimum: 0,
      maximum: 5,
    }),
    scores: Type.Array(Type.Number({ minimum: 0, maximum: 5 }), {
      description: '각 메인 질문의 평균 점수 배열',
    }),
    duration: Type.Number({ description: '전체 소요 시간 (분)', minimum: 0 }),
    durations: Type.Array(Type.Number({ minimum: 0 }), {
      description: '각 메인 질문별 소요 시간 배열 (분)',
    }),
    count: Type.Number({
      description: '전체 질문 수 (메인 + 꼬리)',
      minimum: 0,
    }),
    counts: Type.Array(Type.Number({ minimum: 0 }), {
      description: '각 메인 질문별 꼬리질문 개수 배열',
    }),
    startDate: Type.String({
      format: 'date-time',
      description: '면접 시작 일시 (ISO 8601)',
    }),
    finishDate: Type.String({
      format: 'date-time',
      description: '면접 종료 일시 (ISO 8601)',
    }),
  },
  { $id: SchemaId.ReportDetailMetricsInfo },
)

// 리포트 상세 - 개요 정보
export const S_ReportDetailOverviewInfo = Type.Object(
  {
    interviewInfo: S_ReportDetailInterviewInfo,
    metricsInfo: S_ReportDetailMetricsInfo,
  },
  { $id: SchemaId.ReportDetailOverviewInfo },
)

// 리포트 상세 - 그래프 데이터
export const S_ReportGraphData = Type.Object(
  {
    labels: Type.Array(Type.String(), {
      description: '질문 라벨 배열 (예: ["q1", "q1-1", "q1-2", "q2"])',
    }),
    scores: Type.Array(Type.Number({ minimum: 0, maximum: 5 }), {
      description: '각 질문별 점수 배열 (0~5, 미채점 시 0)',
    }),
    durations: Type.Array(Type.Number({ minimum: 0 }), {
      description: '각 질문별 소요 시간 배열 (분)',
    }),
  },
  { $id: SchemaId.ReportGraphData },
)

// 리포트 상세 - 메인 응답
export const S_ReportDetailResponse = Type.Object(
  {
    overviewInfo: S_ReportDetailOverviewInfo,
    feedback: Type.String({ description: '전체 피드백' }),
    graphData: S_ReportGraphData,
  },
  { $id: SchemaId.ReportDetailResponse, description: '리포트 상세 정보' },
)

// 감정 분석 그래프 데이터
export const S_EmotionGraphData = Type.Object(
  {
    times: Type.Array(Type.Number({ minimum: 0 }), {
      description: '프레임별 시간 배열 (초)',
    }),
    happy: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'happy 감정 확률 배열',
    }),
    sad: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'sad 감정 확률 배열',
    }),
    neutral: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'neutral 감정 확률 배열',
    }),
    angry: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'angry 감정 확률 배열',
    }),
    fear: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'fear 감정 확률 배열',
    }),
    surprise: Type.Array(Type.Number({ minimum: 0, maximum: 1 }), {
      description: 'surprise 감정 확률 배열',
    }),
  },
  { $id: SchemaId.EmotionGraphData },
)

// 리포트 질문 상세 (재귀적 구조)
export const S_ReportDetailQuestion = Type.Recursive(
  (This) =>
    Type.Object(
      {
        id: Type.String({ description: '질문 ID' }),
        aiQuestionId: Type.String({ description: 'AI 질문 ID' }),
        type: Type.Union(
          [
            Type.Literal('TECHNICAL'),
            Type.Literal('PERSONALITY'),
            Type.Literal('TAILORED'),
          ],
          {
            description: '질문 유형',
          },
        ),
        question: Type.String({ description: '질문 내용' }),
        answer: Type.Union([Type.String(), Type.Null()], {
          description: '사용자 답변',
        }),
        score: Type.Union(
          [Type.Number({ minimum: 0, maximum: 5 }), Type.Null()],
          { description: '점수' },
        ),
        createdAt: Type.String({
          format: 'date-time',
          description: '생성 일시',
        }),
        updatedAt: Type.String({
          format: 'date-time',
          description: '수정 일시',
        }),
        rationale: Type.Union([Type.String(), Type.Null()], {
          description: '질문 근거',
        }),
        criteria: Type.Array(Type.String(), { description: '평가 기준' }),
        skills: Type.Array(Type.String(), { description: '관련 기술' }),
        estimatedAnswerTimeSec: Type.Union(
          [Type.Number({ minimum: 0 }), Type.Null()],
          {
            description: '예상 답변 시간 (초)',
          },
        ),
        answerDurationSec: Type.Union(
          [Type.Number({ minimum: 0 }), Type.Null()],
          {
            description: '실제 답변 소요 시간 (초)',
          },
        ),
        answerStartedAt: Type.Union(
          [Type.String({ format: 'date-time' }), Type.Null()],
          {
            description: '답변 시작 일시',
          },
        ),
        answerEndedAt: Type.Union(
          [Type.String({ format: 'date-time' }), Type.Null()],
          {
            description: '답변 종료 일시',
          },
        ),
        strengths: Type.Array(Type.String(), { description: '강점' }),
        improvements: Type.Array(Type.String(), { description: '개선사항' }),
        redFlags: Type.Array(Type.String(), { description: '위험 신호' }),
        feedback: Type.Union([Type.String(), Type.Null()], {
          description: '피드백',
        }),
        interviewSessionId: Type.String({ description: '인터뷰 세션 ID' }),
        parentStepId: Type.Union([Type.String(), Type.Null()], {
          description: '부모 질문 ID (메인 질문의 경우 null)',
        }),
        emotionGraphData: Type.Union([S_EmotionGraphData, Type.Null()], {
          description: '감정 분석 그래프 데이터 (없을 경우 null)',
        }),
        tailSteps: Type.Array(This, { description: '꼬리 질문 목록' }),
      },
      { $id: SchemaId.ReportDetailQuestion },
    ),
  { $id: SchemaId.ReportDetailQuestion },
)

// 리포트 질문 목록 응답
export const S_ReportQuestionsResponse = Type.Object(
  {
    title: Type.String({ description: '면접 세션 제목' }),
    questions: Type.Array(S_ReportDetailQuestion, {
      description: '메인 질문 목록 (꼬리 질문 포함)',
    }),
  },
  {
    $id: SchemaId.ReportQuestionsResponse,
    description: '리포트 질문 상세 정보',
  },
)
