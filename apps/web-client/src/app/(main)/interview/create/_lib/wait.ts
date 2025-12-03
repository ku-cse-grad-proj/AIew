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

    const coverLetterFilename = (formData.get('coverLetter') as File).name
    const portfolioFilename = (formData.get('portfolio') as File).name

    if (coverLetterFilename && portfolioFilename) {
      if (
        processedInterview.coverLetterFilename === coverLetterFilename &&
        processedInterview.portfolioFilename === portfolioFilename
      ) {
        return processedInterview
      }
    } else if (coverLetterFilename) {
      if (processedInterview.coverLetterFilename === coverLetterFilename) {
        return processedInterview
      }
    } else if (portfolioFilename) {
      if (processedInterview.portfolioFilename === portfolioFilename) {
        return processedInterview
      }
    }
    await sleep(intervalMs)
  }

  throw new Error('파일 처리 대기 시간 초과')
}
