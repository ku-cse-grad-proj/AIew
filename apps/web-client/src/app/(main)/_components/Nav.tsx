'use client'

import MainLink from './MainLink'

const LINKS = [
  { href: '/dashboard', label: 'dashboard' },
  { href: '/interview', label: 'interview' },
  { href: '/setting', label: 'setting' },
] as const

export default function Nav({ className }: { className?: string }) {
  return (
    <nav
      className={`bg-bright w-372 h-48 flex items-center gap-3 px-3 rounded-full ${className}`}
    >
      {LINKS.map(({ href, label }) => (
        <MainLink key={href} href={href}>
          {label}
        </MainLink>
      ))}
    </nav>
  )
}
