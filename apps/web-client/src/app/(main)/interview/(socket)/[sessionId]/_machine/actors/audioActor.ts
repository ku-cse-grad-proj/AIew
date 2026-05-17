'use client'
import { fromPromise } from 'xstate'

/**
 * TTS base64 MP3 재생 promise actor.
 *
 * - input.audioBase64 가 비어있으면 즉시 resolve (audio fallback)
 * - audio.play() autoplay 차단 / decode 실패 시 resolve (silent fallback)
 *   → 머신은 onDone 시 idle 로 진행
 * - onended → resolve
 */
export const audioActor = fromPromise<void, { audioBase64: string }>(
  ({ input, signal }) => {
    return new Promise<void>((resolve) => {
      if (!input.audioBase64) {
        resolve()
        return
      }

      let audio: HTMLAudioElement
      try {
        audio = new Audio(`data:audio/mp3;base64,${input.audioBase64}`)
      } catch {
        resolve()
        return
      }

      const handleEnded = () => {
        cleanup()
        resolve()
      }
      const handleError = () => {
        cleanup()
        resolve()
      }

      const cleanup = () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        signal.removeEventListener('abort', onAbort)
        try {
          audio.pause()
        } catch {}
      }

      const onAbort = () => {
        cleanup()
        resolve()
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      signal.addEventListener('abort', onAbort)

      audio.play().catch(() => {
        // autoplay 차단 — 사용자 클릭 트리거 retry 정책은 후속 단계
        // 본 단계에서는 silent resolve 로 머신을 idle 로 진행
        cleanup()
        resolve()
      })
    })
  },
)
