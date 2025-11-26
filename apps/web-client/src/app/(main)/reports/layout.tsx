import { removeReport } from './_lib/action'

import { ReportActionsProvider } from '@/app/hooks/ReportActionsContext'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReportActionsProvider
      value={{
        removeReport,
      }}
    >
      {children}
    </ReportActionsProvider>
  )
}
