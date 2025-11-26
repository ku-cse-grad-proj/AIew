import { ReactNode, Suspense } from 'react'

import QuestionsPanel from '../_components/questionsPannel/QuestionsPannel'
import QuestionsPanelSkeleton from '../_components/questionsPannel/QuestionsPannelSkeleton'

export default function ReportLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ reportId: string }>
}) {
  return (
    <div className="w-full flex-1 min-h-0 flex gap-24">
      <div className="flex-7 min-h-0 flex flex-col">{children}</div>
      <div className="flex-3 shrink-0 min-h-0 flex flex-col">
        <Suspense fallback={<QuestionsPanelSkeleton />}>
          <QuestionsPanel params={params} />
        </Suspense>
      </div>
    </div>
  )
}
