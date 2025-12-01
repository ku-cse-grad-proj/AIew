export const QUESTION_TYPES = {
  PERSONALITY: '인성',
  TECHNICAL: '기술',
  TAILORED: '맞춤',
} as const

export type QuestionType = keyof typeof QUESTION_TYPES
export type QuestionTypeLabel = (typeof QUESTION_TYPES)[QuestionType]
