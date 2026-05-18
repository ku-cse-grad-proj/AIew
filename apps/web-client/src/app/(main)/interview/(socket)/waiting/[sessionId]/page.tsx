import { Suspense } from 'react'

import InterviewInfo from './components/InterviewInfo'
import CardSkeleton from './components/InterviewInfoSkeleton'
import LoadingCard from './components/LoadingCard'
import LoadingCircle from './components/LoadingCircle'

import Card from '@/app/(main)/interview/_components/Card'

function LoadingCardFallback() {
  return (
    <Card className="w-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-48">
        <LoadingCircle />
        <span
          className="text-black shimmer-text"
          data-content="preparing interview..."
        >
          preparing interview...
        </span>
      </div>
    </Card>
  )
}

export default function WaitingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col lg:flex-row gap-24">
      <Suspense fallback={<CardSkeleton />}>
        <InterviewInfo params={params} />
      </Suspense>
      <Suspense fallback={<LoadingCardFallback />}>
        <LoadingCard />
      </Suspense>
    </div>
  )
}
