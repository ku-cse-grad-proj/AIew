import Image from 'next/image'
import { Suspense } from 'react'

import Nav from './Nav'
import Profile from './Profile'

import Logo from '@/app/_components/Logo'

export default function MainHeader() {
  return (
    <header
      className="
        w-full h-144 grid items-center p-16 grid-cols-2 gap-16
        sm:max-w-1248 sm:h-96 sm:p-24 sm:grid-cols-[1fr_auto_1fr]"
    >
      {/* Left (span) */}
      <Logo
        href="/dashboard"
        className="order-1 justify-self-start sm:order-none"
      />

      {/* Center (Nav) */}
      <Nav
        className="
          order-2 col-span-2 justify-self-center
          sm:order-none sm:col-span-1 sm:justify-self-center sm:min-w-[384px]
        "
      />

      {/* Right (Profile) */}
      <div className="order-1 justify-self-end sm:order-none">
        <Suspense
          fallback={
            <Image
              src={'profile.svg'}
              width={48}
              height={48}
              alt="profile"
              className="rounded-full"
            />
          }
        >
          <Profile />
        </Suspense>
      </div>
    </header>
  )
}
