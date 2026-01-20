'use server'

import { getInterview } from '../../_lib/api'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 좋은 방법은 아니지만 일단은 이렇게 구현함...
export async function waitUntilFilesProcessed(
  id: string,
  formData: FormData,
  {
    intervalMs = 500,
    timeoutMs = 10000,
  }: { intervalMs?: number; timeoutMs?: number } = {},
) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const processedInterview = (await getInterview(id, false)) as Interview

    const coverLetterFile = formData.get('coverLetter')
    const portfolioFile = formData.get('portfolio')

    const coverLetterFilename =
      coverLetterFile instanceof File ? coverLetterFile.name : null
    const portfolioFilename =
      portfolioFile instanceof File ? portfolioFile.name : null

    // coverLetter는 필수, portfolio는 선택
    const coverLetterMatches =
      processedInterview.coverLetterFilename === coverLetterFilename
    const portfolioMatches = portfolioFilename
      ? processedInterview.portfolioFilename === portfolioFilename
      : !processedInterview.portfolioFilename // portfolio 없으면 서버에도 없어야 함

    if (coverLetterMatches && portfolioMatches) {
      return processedInterview
    }
    await sleep(intervalMs)
  }

  throw new Error('파일 처리 대기 시간 초과')
}
