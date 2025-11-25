import Image from 'next/image'
import { Suspense } from 'react'

import Nav from './Nav'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export default function MainHeader() {
  return (
    <header
      className="
        w-full h-144 grid items-center p-16 grid-cols-2 gap-16
        sm:max-w-1248 sm:h-96 sm:p-24 sm:grid-cols-[1fr_auto_1fr]"
    >
      {/* Left (span) */}
      <span className="order-1 justify-self-start text-primary text-4xl font-bold sm:order-none">
        AIew
      </span>

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

//TODO:: logout시 cache 파기
async function Profile() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/me`, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAG.USER] },
  })
  const me = res.ok ? await res.json() : null
  const src = me?.pic_url ?? 'profile.svg'

  return (
    <Image
      className="justify-self-end rounded-full"
      src={src}
      alt="profile img"
      width={48}
      height={48}
    />
  )
}
