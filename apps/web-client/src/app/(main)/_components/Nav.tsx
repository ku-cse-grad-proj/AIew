import { Suspense } from 'react'

import MainLink from './MainLink'

const LINKS = [
  { href: '/dashboard', label: 'dashboard' },
  { href: '/interview', label: 'interview' },
  { href: '/reports', label: 'report' },
] as const

export default function Nav({ className }: { className?: string }) {
  return (
    <nav
      className={`bg-neutral-card w-372 h-48 flex items-center gap-3 px-3 rounded-full shadow-box ${className}`}
    >
      <Suspense>
        {LINKS.map(({ href, label }) => (
          <MainLink key={href} href={href}>
            {label}
          </MainLink>
        ))}
      </Suspense>
    </nav>
  )
}
