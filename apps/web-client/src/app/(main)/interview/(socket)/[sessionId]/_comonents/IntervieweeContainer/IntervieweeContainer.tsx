'use client'

import { HTMLProps, useState } from 'react'

import IntervieweePannel from './IntervieweePannel'
import QuestionPannel from './QuestionPannel'

export default function IntervieweeContainer({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) {
  const [showList, setShowList] = useState(false)
  const toggleShowList = () => setShowList(!showList)

  return (
    <div className={`relative ${className}`} {...props}>
      {/* 기본 패널 */}
      <IntervieweePannel onClick={toggleShowList} />

      {/* 슬라이드 오버레이 */}
      <div
        className={`absolute inset-0 rounded-[20px] overflow-hidden ${
          showList ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!showList}
      >
        <QuestionPannel
          onClick={toggleShowList}
          className={`w-full h-full rounded-[20px] transition-transform duration-300 ease-in-out will-change-transform ${
            showList ? 'translate-x-0' : '-translate-x-full'
          }`}
        />
      </div>
    </div>
  )
}
