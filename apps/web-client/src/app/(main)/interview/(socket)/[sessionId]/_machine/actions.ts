'use server'

import { revalidatePath } from 'next/cache'

/**
 * Phase 2.2 — interviewMachine 의 revalidate 콜백 server action.
 *
 * 머신이 `interviewFinished` 진입 시 + `REPORT_READY` 도착 시 두 시점에 호출.
 * Next.js cache 무효화로 종료된 세션의 상세/보고서뿐 아니라 list/dashboard
 * 도 최신 status 가 반영되도록 한다.
 */
export async function revalidateInterview(sessionId: string) {
  // 종료된 세션 자체
  revalidatePath(`/reports/${sessionId}`)
  revalidatePath(`/interview/${sessionId}`)
  // 목록 / 대시보드 — 면접 완료 후 status 변경 + 최근 면접 카드 갱신
  revalidatePath('/dashboard')
  revalidatePath('/interview')
}
