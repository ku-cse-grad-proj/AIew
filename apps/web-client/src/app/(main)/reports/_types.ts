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
  interviewInfo: InterviewInfo
  metricsInfo: MetricsInfo
}

export type ReportResponse = {
  overviewInfo: OverviewInfo
  feedback: string
}
