'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useCallback, useEffect } from 'react'

import Cancel from '@/../public/icons/cancel.svg'

export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()
  const closeModal = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      closeModal()
    }
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () =>
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [closeModal])

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-100"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full bg-neutral-card relative sm:w-640 sm:max-h-640 sm:rounded-[20px]"
      >
        <button
          type="button"
          onClick={closeModal}
          className="hidden sm:block absolute right-8 top-8"
        >
          <Cancel width={24} height={24} />
        </button>
        {children}
      </div>
    </div>
  )
}
