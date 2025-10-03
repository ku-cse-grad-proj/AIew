'use client'

import { useState } from 'react'

import ResultSection from './ResultSection'

export default function ResultWrapper({ className }: { className?: string }) {
  const [showEmotional, setShowEmotional] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <ResultSection
        showEmotional={showEmotional}
        onClick={() => setShowEmotional(false)}
      >
        <h2 className="absolute top-0 pl-24 pt-10 font-medium">feedback</h2>
      </ResultSection>
      <ResultSection
        showEmotional={showEmotional}
        onClick={() => setShowEmotional(true)}
        emotional
      >
        <h2 className="absolute bottom-0 pl-24 pb-10 font-medium">
          emotional feedback
        </h2>
      </ResultSection>
    </div>
  )
}
