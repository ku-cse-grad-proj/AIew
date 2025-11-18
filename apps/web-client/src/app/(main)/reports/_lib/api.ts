import { notFound } from 'next/navigation'

import { ReportQuestionsResponse, ReportResponse } from '../_types'

import { privateFetch } from '@/app/lib/fetch'

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
