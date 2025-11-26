'use client'

import { createContext, useContext } from 'react'

type ReportActionsContextValue = {
  removeReport: (id: string) => Promise<void>
}

const ReportActionsContext = createContext<ReportActionsContextValue | null>(
  null,
)

export function ReportActionsProvider({
  value,
  children,
}: {
  value: ReportActionsContextValue
  children: React.ReactNode
}) {
  return (
    <ReportActionsContext.Provider value={value}>
      {children}
    </ReportActionsContext.Provider>
  )
}

export function useReportActions() {
  const ctx = useContext(ReportActionsContext)
  if (!ctx) {
    throw new Error(
      'useReportActions must be used within ReportActionsProvider',
    )
  }
  return ctx
}
