'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

const PopoverContext = createContext<{
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

/**
 * Popover 컴포넌트는 팝오버 트리거 버튼과 팝오버 콘텐츠를 감싸는 컨텍스트 제공자입니다.
 *
 * Usage:
 * ```tsx
 * <Popover>
 *   <PopoverTriggerButton>Open Popover</PopoverTriggerButton>
 *   <PopoverContent>
 *     <div>Your popover content here</div>
 *   </PopoverContent>
 * </Popover>
 * ```
 * - `PopoverTriggerButton`: 팝오버를 여닫는 버튼입니다.
 * - `PopoverContent`: 팝오버의 실제 콘텐츠를 렌더링합니다.
 * - `Content`의 X 버튼이나 팝오버 외부를 클릭하면 팝오버가 닫힙니다
 *
 */

export default function Popover({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

export function usePopover() {
  const ctx = useContext(PopoverContext)
  if (!ctx) {
    throw new Error('usePopover must be used within a PopoverProvider')
  }
  return ctx
}
