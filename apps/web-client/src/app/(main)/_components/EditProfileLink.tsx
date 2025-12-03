'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MouseEvent } from 'react'

import { useProfileUpdatingStore } from '@/app/lib/useProfileUpdatingStore'

export default function EditProfileLink() {
  const pathname = usePathname()
  const from = pathname.split('/')[1]
  const isUpdating = useProfileUpdatingStore((state) => state.isUpdating)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isUpdating) return
    e.preventDefault()
    // TODO: toast 같은 걸로 "프로필 저장 중입니다" 안내
    alert('프로필을 저장하는 중입니다. 잠시만 기다려주세요.')
  }

  return (
    <Link
      className={`border border-neutral-subtext w-full py-8 rounded-[10px] inline-flex items-center justify-center transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-subtext hover:text-neutral-card'}`}
      href={`/profile/edit?from=${from}`}
      aria-disabled={isUpdating}
      onClick={handleClick}
    >
      <span className="transition-colors">
        {isUpdating ? 'updating profile...' : 'edit profile'}
      </span>
    </Link>
  )
}
