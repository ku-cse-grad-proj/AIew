import { notFound } from 'next/navigation'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export async function getInterviews() {
  //환경변수를 함스 스코프 밖에 선언하면 undefined됨
  const { CORE_API_URL, API_PREFIX } = process.env
  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/interviews`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.INTERVIEWS] } },
  )

  if (!response.ok) {
    throw new Error(`인터뷰 조회 중 오류가 발생했습니다.`)
  }

  return await response.json()
}

export async function getInterview(id: string, cache = true) {
  const { CORE_API_URL, API_PREFIX } = process.env
  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/interviews/${id}`,
    {
      cache: cache ? 'force-cache' : 'no-cache',
      next: { tags: [CACHE_TAG.INTERVIEW(id)] },
    },
  )

  if (response.status === 404) {
    notFound()
  }

  if (!response.ok) {
    throw new Error(`인터뷰 조회 중 오류가 발생했습니다.`)
  }

  return await response.json()
}
