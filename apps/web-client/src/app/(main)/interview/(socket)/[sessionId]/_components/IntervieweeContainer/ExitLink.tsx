'use client'
import Link from 'next/link'

import Exit from '@/../public/icons/exit.svg'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'

export default function ExitLink() {
  const finished = useInterviewStore((state) => state.finished)
  return (
    <Link
      className={`w-full flex items-center justify-center gap-10 py-12 rounded-[10px] 
        ${finished ? 'bg-primary text-neutral-card' : 'outline outline-1 outline-neutral-subtext text-neutral-subtext'}`}
      href={'/interview'}
      onNavigate={(e) => {
        if (!finished) {
          const ok = confirm('Are you sure you want to leave the interview?')
          if (!ok) {
            e.preventDefault()
          }
        }
      }}
    >
      <Exit width={20} height={20} fill="currentColor" />
      <span className="font-medium leading-[24px]">
        {finished ? 'Finish' : 'Leave'} Interview
      </span>
    </Link>
  )
}
