'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MainLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  //href와 동일한 주소 이거나, 그 하위 주소일 경우 active
  const isActive = pathname === href || pathname.startsWith(href + '/')

  const basicStyle =
    'w-120 h-42 font-32 leading-42 flex items-center justify-center'
  const activeStyle = 'text-neutral-inverse bg-primary rounded-full'

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`${basicStyle} ${isActive ? activeStyle : 'text-neutral-subtext'}`}
    >
      {children}
    </Link>
  )
}
