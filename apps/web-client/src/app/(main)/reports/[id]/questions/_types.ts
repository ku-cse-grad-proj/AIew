export type QuestionItem = {
  id: string
  question: string
}

export type QuestionList = QuestionItem & {
  followUps: QuestionItem[]
}
