'use client'

import { useState } from 'react'

import { QuestionFeedback } from '../_types'

import FeedbackSection from './FeedbackSection'
import ResultSection from './ResultSection'

export default function ResultWrapper({
  className,
  feedbacks,
}: {
  className?: string
  feedbacks: QuestionFeedback[]
}) {
  const [showEmotional, setShowEmotional] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <FeedbackSection
        feedbacks={feedbacks}
        showEmotional={showEmotional}
        onClick={() => setShowEmotional(false)}
      ></FeedbackSection>
      <ResultSection
        showEmotional={showEmotional}
        onClick={() => setShowEmotional(true)}
        emotional
      >
        <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">
          emotional feedback
        </h2>
      </ResultSection>
    </div>
  )
}
