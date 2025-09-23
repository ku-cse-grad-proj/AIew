'use client'
import { useState } from 'react'

import HintButton from './HintButton'

export default function HintArea({
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  const [showHint, setShowHint] = useState(false)

  const handleShowHint = () => {
    setShowHint(!showHint)
  }
  return (
    <div {...props} className={`relative ${props.className}`}>
      <div
        className="flex-1 w-full h-full flex flex-col justify-between items-start"
        inert={showHint}
      >
        <HintButton onClick={handleShowHint} />
        {props.children}
      </div>
      <div className="absolute inset-0 overflow-hidden" inert={!showHint}>
        <HintPannel
          onClick={handleShowHint}
          className={`transition-transform duration-300 ease-in-out will-change-transform
            ${showHint ? 'translate-y-0' : 'translate-y-full'}`}
        />
      </div>
    </div>
  )
}

export function HintPannel({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`w-full h-full bg-gray-300 p-16 relative ${className}`}
      onClick={onClick}
    >
      여긴 힌트 영역이에요~
    </div>
  )
}
