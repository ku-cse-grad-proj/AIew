import { Suspense } from 'react'

import InterviewInfo from './components/InterviewInfo'
import CardSkeleton from './components/InterviewInfoSkeleton'
import LoadingCard from './components/LoadingCard'

export default function WaitingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  return (
    <div className="w-full h-full flex flex-col lg:flex-row p-24 gap-24">
      <Suspense fallback={<CardSkeleton />}>
        <InterviewInfo params={params} />
      </Suspense>
      <LoadingCard />
    </div>
  )
}
