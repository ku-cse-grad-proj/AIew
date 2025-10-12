import Nav from './Nav'

import { privateFetch } from '@/app/lib/fetch'

export default async function MainHeader() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/me`)
  const me = res.ok ? await res.json() : null
  const src = me?.pic_url ?? 'profile.svg'

  return (
    <header className="w-full max-w-1248 mx-auto h-96 grid grid-cols-3 items-center p-24">
      <span className="justify-self-start text-primary text-4xl font-bold">
        AIew
      </span>
      <Nav className="justify-self-center" />
      <img
        className="justify-self-end rounded-full"
        src={src}
        alt="profile img"
        width={48}
        height={48}
      />
    </header>
  )
}
