'use client'

import { Suspense } from 'react'

import LoadingCircle from './LoadingCircle'

import Card from '@/app/(main)/interview/_components/Card'
import FooterButtons from '@/app/(main)/interview/_components/FooterButtons'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'

export default function LoadingCard() {
  const questions = useInterviewStore((state) => state.questions)
  return (
    <Card className="w-full flex flex-col items-center justify-center relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-48">
        <LoadingCircle />
        <span
          className={`text-black ${!questions && `shimmer-text`}`}
          data-content={
            questions
              ? 'All set. Ready when you are.'
              : 'preparing interview...'
          }
        >
          {questions
            ? 'All set. Ready when you are.'
            : 'preparing interview...'}
        </span>
      </div>
      <Suspense>
        <FooterButtons mode="waiting" isQuestionsReady={!!questions} />
      </Suspense>
    </Card>
  )
}
