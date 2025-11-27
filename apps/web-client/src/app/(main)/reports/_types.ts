export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined
}>

export type Query = [string, string][]

export type InterviewInfo = {
  title: string
  jobTitle: string
  jobSpec: string
  coverLetterFilename: string
  portfolioFilename: string
  idealTalent: string
}

export type MetricsInfo = {
  score: number
  scores: number[]
  duration: number
  durations: number[]
  count: number
  counts: number[]
  startDate: string // ISO 8601 형태의 날짜
  finishDate: string
}

export type OverviewInfo = {
  id: string
  interviewInfo: InterviewInfo
  metricsInfo: MetricsInfo
}

export type GraphData = {
  labels: string[]
  scores: number[]
  durations: number[]
}

export type ReportResponse = {
  overviewInfo: OverviewInfo
  feedback: string
  graphData: GraphData
}

export type EmotionGraphData = {
  times: (string | number)[]
  angry: number[]
  fear: number[]
  happy: number[]
  neutral: number[]
  sad: number[]
  surprise: number[]
}

export type EmotionGraphDataWithId = {
  id: string
  graphData: EmotionGraphData
}

export type ReportQuestionsResponse = {
  title: string
  questions: ReportQuestionStep[]
}

export type ReportQuestionStep = {
  id: string
  aiQuestionId: string
  type: 'TECHNICAL' | 'PERSONALITY' | 'TAILORED'
  question: string
  answer: string
  score: number
  createdAt: string
  updatedAt: string
  rationale: string
  criteria: string[]
  skills: string[]
  estimatedAnswerTimeSec: number
  answerDurationSec: number
  answerStartedAt: string
  answerEndedAt: string
  strengths: string[]
  improvements: string[]
  redFlags: string[]
  feedback: string
  interviewSessionId: string
  parentStepId: string | null
  tailSteps: ReportQuestionStep[]
  emotionGraphData: EmotionGraphData
}
