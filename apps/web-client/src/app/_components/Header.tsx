import Link from 'next/link'

import Logo from './Logo'

export function Header() {
  return (
    <header className="bg-white border-b border-[var(--color-neutral-border)] sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-[24px] py-[16px] flex items-center justify-between relative">
        <div className="flex items-center gap-[8px]">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center gap-80 absolute left-1/2 -translate-x-1/2">
          <a
            href="#features"
            className="text-[var(--color-neutral-text)] hover:text-[var(--color-primary)] transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-[var(--color-neutral-text)] hover:text-[var(--color-primary)] transition-colors font-medium"
          >
            How It Works
          </a>
        </nav>

        <div className="flex items-center gap-[16px]">
          <Link
            href="/dashboard"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-[24px] py-[8px] rounded-lg transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  )
}
