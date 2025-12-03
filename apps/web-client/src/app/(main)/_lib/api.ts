import { UserResponse } from '../_types'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export async function getUser(): Promise<UserResponse> {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/me`, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAG.USER] },
  })

  if (!res.ok) {
    throw new Error('user 정보를 조회 중 문제가 발생했습니다.')
  }
  return await res.json()
}

export async function signOut() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/auth/logout`, {
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error('로그아웃 중 문제가 발생했습니다.')
  }
}
