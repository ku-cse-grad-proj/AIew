'use client'

import { ReactNode, useState, Children } from 'react'

import DeckCard from './DeckCard'

/**
 * DeckLayout
 *
 * 요구사항:
 * - children으로 **반드시 두 개의 섹션**을 전달해야 합니다.
 * - JSX에서 **첫 번째 child는 Top Card**, **두 번째 child는 Bottom Card**로 해석됩니다.
 *   예)
 *   ```tsx
 *   <DeckLayout>;
 *     <TopSection />;     // ← 윗장(Top card)
 *     <BottomSection />;  // ← 아랫장(Bottom card)
 *   </DeckLayout>;
 *   ```
 *
 * 동작:
 * - 처음에는 Top card가 위에 보입니다.
 * - 각 카드 클릭으로 Top/Bottom 전환이 가능합니다.
 */

export default function DeckLayout({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const [showBottom, setShowBottom] = useState(false)
  const [top, bottom] = Children.toArray(children)
  return (
    <div className={`relative ${className}`}>
      <DeckCard showBottom={showBottom} onClick={() => setShowBottom(false)}>
        {top}
      </DeckCard>
      <DeckCard
        bottom
        showBottom={showBottom}
        onClick={() => setShowBottom(true)}
      >
        {bottom}
      </DeckCard>
    </div>
  )
}
