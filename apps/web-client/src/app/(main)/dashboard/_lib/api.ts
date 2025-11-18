import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export async function getDashboard() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/dashboard`, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAG.INTERVIEWS, CACHE_TAG.REPORTS, CACHE_TAG.USER] },
  })

  if (!res.ok) {
    throw new Error('dashboard를 조회 중 문제가 발생했습니다.')
  }

  return await res.json()
}

export async function getLineGraph() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/dashboard/graphs/line`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.REPORTS] } },
  )

  if (!res.ok) {
    throw new Error('line graph data를 조회 중 문제가 발생했습니다.')
  }
  return await res.json()
}

export async function getCompanyGraph() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/dashboard/graphs/company`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.REPORTS] } },
  )

  if (!res.ok) {
    throw new Error('company graph data를 조회 중 문제가 발생했습니다.')
  }
  return await res.json()
}
