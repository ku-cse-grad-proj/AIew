import { QuestionTypeLabel } from '@/app/_types'

export type QuestionItem = {
  id: string
  question: string
}

export type QuestionList = QuestionItem & {
  followUps: QuestionItem[]
}

export type QuestionInfo = QuestionItem & {
  type: QuestionTypeLabel
  rationale: string
  criteria: string[]
  answer: string
  score: number
}

export type QuestionReview = {
  title: string
  questionInfos: QuestionInfo[]
}

export type QuestionFeedback = {
  id: string
  redFlags: string[]
  improvements: string[]
  feedback: string
}
