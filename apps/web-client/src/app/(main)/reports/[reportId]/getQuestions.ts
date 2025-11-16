import { ReportQuestionsResponse } from '../_types'

import { privateFetch } from '@/app/lib/fetch'

export default async function getQuestions(
  id: string,
): Promise<ReportQuestionsResponse> {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/${id}/questions`,
  )

  const data = await res.json()
  return data
}
