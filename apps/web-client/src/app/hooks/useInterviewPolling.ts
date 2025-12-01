'use client'

import { useEffect } from 'react'

import { useInterviewActions } from './InterviewActionsContext'

/**
 * 인터뷰 상태가 PENDING인 동안 주기적으로 서버에서 상태를 조회하는 polling 훅.
 * 일정 시간(기본 10초)을 초과하면 polling을 중단한다.
 *
 * @hook
 *
 * @param interview 현재 카드에 표시 중인 인터뷰 상태
 * @param setInterview 인터뷰 상태를 갱신하는 상태 setter
 * @param options.intervalMs polling 주기 (ms) - 기본값 1000ms
 * @param options.timeoutMs polling을 중단할 최대 대기 시간 (ms) - 기본값 20000ms
 */
export function useInterviewPolling(
  interview: Interview,
  setInterview: (interview: Interview) => void,
  options: {
    intervalMs?: number
    timeoutMs?: number
  } = {
    intervalMs: 1000,
    timeoutMs: 20000,
  },
) {
  const { getInterview, revalidateInterview } = useInterviewActions()

  useEffect(() => {
    // PENDING 상태가 아니면 polling 하지 않음
    if (interview.status !== 'PENDING') return

    let isCancelled = false

    const interval = setInterval(async () => {
      try {
        const updated = await getInterview(interview.id, false)
        if (isCancelled) return

        setInterview(updated)

        if (updated.status !== 'PENDING') {
          clearInterval(interval)
          clearTimeout(timeoutId)
          revalidateInterview(interview.id)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch interview:', err)
        }
      }
    }, options.intervalMs)

    // 일정 시간이 지나면 polling 강제 중단
    const timeoutId = setTimeout(() => {
      clearInterval(interval)
      isCancelled = true
      console.warn(
        `Interview ${interview.id} polling timed out after ${options.timeoutMs}ms`,
      )
    }, options.timeoutMs)

    return () => {
      isCancelled = true
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [
    interview.id,
    interview.status,
    getInterview,
    revalidateInterview,
    setInterview,
  ])
}
