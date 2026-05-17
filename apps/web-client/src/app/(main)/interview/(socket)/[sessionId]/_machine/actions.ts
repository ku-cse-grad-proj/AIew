'use server'

import { revalidatePath } from 'next/cache'

/**
 * Phase 2.2 — interviewMachine 의 revalidate 콜백 server action.
 *
 * 머신이 `interviewFinished` 진입 시 호출. Next.js cache 무효화로
 * /reports/[sessionId] 가 latest 데이터로 갱신되도록 한다.
 */
export async function revalidateInterview(sessionId: string) {
  revalidatePath(`/reports/${sessionId}`)
  revalidatePath(`/interview/${sessionId}`)
}
