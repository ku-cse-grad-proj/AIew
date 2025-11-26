'use client'

import { useRouter } from 'next/navigation'

import Back from '@/../public/icons/toggle_true.svg'

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter()

  const handleClick = () => {
    router.back()
  }
  return (
    <button onClick={handleClick} className={className}>
      <Back width={24} height={24} />
    </button>
  )
}
