'use client'

import Card from '../../../_components/Card'
import FooterButtons from '../../../_components/FooterButtons'

import LoadingCircle from './LoadingCircle'

import { useInterviewSocket } from '@/app/hooks/useInterviewSocket'

export default function LoadingCard({ sessionId }: { sessionId: string }) {
  const { isQuestionsReady } = useInterviewSocket(sessionId)
  return (
    <Card className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-48">
        <LoadingCircle />
        <span
          className={`text-black ${!isQuestionsReady && `shimmer-text`}`}
          data-content={
            isQuestionsReady
              ? 'All set. Ready when you are.'
              : 'preparing interview...'
          }
        >
          {isQuestionsReady
            ? 'All set. Ready when you are.'
            : 'preparing interview...'}
        </span>
      </div>
      <FooterButtons isWaiting isQuestionsReady={isQuestionsReady} />
    </Card>
  )
}
