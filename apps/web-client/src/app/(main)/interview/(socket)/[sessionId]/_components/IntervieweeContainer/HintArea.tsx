'use client'
import { useState } from 'react'

import HintButton from './HintButton'
import HintPannel from './HintPannel'

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
      {/* HintPannel은 부모 padding을 무시해야 함 */}
      <div
        className="-mx-24 -mb-24 absolute inset-0 overflow-hidden rounded-[20px]"
        inert={!showHint}
      >
        <HintPannel
          onClick={handleShowHint}
          className={`transition-transform duration-300 ease-in-out will-change-transform
            ${showHint ? 'translate-y-0' : 'translate-y-full'}`}
        />
      </div>
    </div>
  )
}
