import Image from 'next/image'
import { Suspense } from 'react'

import Nav from './Nav'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export default function MainHeader() {
  return (
    <header className="w-full max-w-1248 mx-auto h-96 grid grid-cols-3 items-center p-24">
      <span className="justify-self-start text-primary text-4xl font-bold">
        AIew
      </span>
      <Nav className="justify-self-center" />
      <Suspense
        fallback={
          <Image
            src={'profile.svg'}
            width={48}
            height={48}
            alt="profile"
            className="justify-self-end"
          />
        }
      >
        <Profile />
      </Suspense>
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
