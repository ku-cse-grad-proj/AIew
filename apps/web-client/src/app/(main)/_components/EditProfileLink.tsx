'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function EditProfileLink() {
  const pathname = usePathname()
  //dashboard, interview, reports 중 하나
  const from = pathname.split('/')[1]
  return (
    <Link
      className="border border-neutral-subtext w-full py-8 rounded-[10px] inline-flex items-center justify-center"
      href={`/profile/edit?from=${from}`}
    >
      <span>edit profile</span>
    </Link>
  )
}
