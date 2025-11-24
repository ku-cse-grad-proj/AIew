import {
  removeInterview,
  revalidateInterview,
  revalidateInterviewAndReports,
} from './_lib/action'
import { getInterview } from './_lib/api'

import { InterviewActionsProvider } from '@/app/hooks/InterviewActionsContext'

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InterviewActionsProvider
      value={{
        removeInterview,
        getInterview,
        revalidateInterview,
        revalidateInterviewAndReports,
      }}
    >
      {children}
    </InterviewActionsProvider>
  )
}
