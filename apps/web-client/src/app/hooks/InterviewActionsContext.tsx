'use client'

import { createContext, ReactNode, useContext } from 'react'

type InterviewActionsContextValue = {
  removeInterview: (id: string) => Promise<void>
  getInterview: (id: string, cache: boolean) => Promise<Interview>
  updateInterviewCache: (id: string) => void
}

const InterviewActionsContext =
  createContext<InterviewActionsContextValue | null>(null)

export function InterviewActionsProvider({
  value,
  children,
}: {
  value: InterviewActionsContextValue
  children: ReactNode
}) {
  return (
    <InterviewActionsContext.Provider value={value}>
      {children}
    </InterviewActionsContext.Provider>
  )
}

export function useInterviewActions() {
  const ctx = useContext(InterviewActionsContext)
  if (!ctx) {
    throw new Error(
      'useInterviewActions must be used within InterviewActionsProvider',
    )
  }
  return ctx
}
