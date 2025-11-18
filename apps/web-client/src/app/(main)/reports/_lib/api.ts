import { notFound } from 'next/navigation'

import { ReportQuestionsResponse, ReportResponse } from '../_types'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'
export type Query = [string, string][]

export async function getTotalPage(query: Query) {
  const { CORE_API_URL, API_PREFIX } = process.env

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/pages/count?${new URLSearchParams(query)}`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.REPORTS] } },
  )

  if (!response.ok) {
    throw new Error('report 조회 중 문제가 발생했습니다.')
  }

  return await response.json()
}

export async function getSummary(query: Query) {
  const { CORE_API_URL, API_PREFIX } = process.env

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/summary?${new URLSearchParams(query)}`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.REPORTS] } },
  )

  if (!response.ok) {
    throw new Error('Summary 조회 중 문제가 발생했습니다.')
  }

  return await response.json()
}

export async function getReports(query: Query) {
  const { CORE_API_URL, API_PREFIX } = process.env

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/?${new URLSearchParams(query)}`,
    { cache: 'force-cache', next: { tags: [CACHE_TAG.REPORTS] } },
  )

  if (!response.ok) {
    throw new Error('Reports 조회 중 문제가 발생했습니다.')
  }
  return await response.json()
}

export async function getReport(id: string): Promise<ReportResponse> {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/${id}`,
    { cache: 'force-cache' },
  )

  if (res.status == 404) {
    notFound()
  }

  if (!res.ok) {
    throw new Error('report를 조회하던 중 문제가 생겼습니다.')
  }

  return await res.json()
}

export async function getQuestions(
  id: string,
): Promise<ReportQuestionsResponse> {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/${id}/questions`,
    { cache: 'force-cache' },
  )

  if (res.status == 404) {
    notFound()
  }

  if (!res.ok) {
    throw new Error('Question를 조회하던 중 문제가 생겼습니다.')
  }

  return await res.json()
}
