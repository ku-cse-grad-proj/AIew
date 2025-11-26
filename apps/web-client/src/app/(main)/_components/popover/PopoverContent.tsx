'use client'

interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean
}

import { HTMLAttributes, useEffect } from 'react'

import { usePopover } from './Popover'

import Cancel from '@/../public/icons/cancel.svg'

export default function PopoverContent({
  showCloseButton = true,
  ...props
}: PopoverContentProps) {
  const { isOpen, setIsOpen } = usePopover()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const closePopover = () => {
    setIsOpen(false)
  }
  if (!isOpen) return null
  return (
    <>
      <div
        {...props}
        role="dialog"
        aria-modal="false"
        className={`absolute ${props.className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button onClick={closePopover} className="absolute top-4 right-4">
            <Cancel width={24} height={24} />
          </button>
        )}
        {props.children}
      </div>
      <div className="fixed inset-0 z-10" onClick={closePopover} />
    </>
  )
}
