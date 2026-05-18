'use client'

import { useRouter } from 'next/navigation'
import { env } from 'next-runtime-env'
import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

import { InterviewContext } from '../../_machine/interviewContext'

/**
 * Phase 2.2 — answerStore 의 stepId/startAt/endAt 을 머신 context 로부터 구독.
 *
 * 비디오 업로드용 socket 은 면접 머신과 별개의 채널로 단순 emit 만 수행.
 * (옛 코드는 interviewSocket 싱글톤 사용. Phase 2.2 단계에서는 zustand store
 * 의존을 제거하고 자체 socket 인스턴스로 emit. socket 분리는 별 PR에서 통합.)
 *
 * AIEW-237 후속 — 카메라/마이크 lifecycle leak 수정
 * - setupStream 의 await race: cleanup 이 getUserMedia resolve 전에 실행되면
 *   stale stream 이 streamRef 에 할당되어 leak. disposed 플래그로 차단.
 * - MediaRecorder 의 cloned video track: rec.stop() 만으로는 clone track 이
 *   해제되지 않아 카메라 indicator 가 계속 켜진 상태로 남는다. 명시적으로
 *   recStream tracks 를 stop.
 * - useEffect cleanup 에 recorder.stop() 추가하여 unmount 시 녹화 중이어도
 *   recorder + cloned track 을 모두 해제.
 */
export default function Interviewee() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordRef = useRef<MediaRecorder | null>(null)
  const recStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const uploadSocketRef = useRef<Socket | null>(null)
  const router = useRouter()

  const stepId = InterviewContext.useSelector(
    (state) => state.context.currentQuestion.stepId,
  )
  const startAt = InterviewContext.useSelector(
    (state) => state.context.answer.startAt,
  )
  const endAt = InterviewContext.useSelector(
    (state) => state.context.answer.endAt,
  )

  /**
   * recorder + cloned video track 을 안전하게 stop.
   * - rec.stop() 만 호출하면 MediaRecorder 가 종료되어도 입력 MediaStream 의
   *   track 은 살아남아 카메라 indicator 가 꺼지지 않는다.
   * - recStream 의 tracks 와 recorder 입력 stream tracks 를 모두 명시 stop.
   */
  const teardownRecorder = () => {
    const rec = recordRef.current
    if (rec) {
      try {
        if (rec.state !== 'inactive') rec.stop()
      } catch {}
    }
    recordRef.current = null

    const recStream = recStreamRef.current
    if (recStream) {
      recStream.getTracks().forEach((t) => {
        try {
          t.stop()
        } catch {}
      })
    }
    recStreamRef.current = null
  }

  useEffect(() => {
    // React 19 / Next.js dev 이중 effect 또는 navigation 으로 effect cleanup 이
    // getUserMedia resolve 전에 실행되는 경우, 늦게 도착한 stream 이
    // streamRef 에 할당되어 leak. disposed 플래그로 차단.
    let disposed = false

    const setupStream = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert(
          '해당 브라우저는 카메라/마이크를 지원하지 않아 interview를 진행할 수 없습니다',
        )
        router.back()
        return
      }

      if (streamRef.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        })
        if (disposed) {
          // cleanup 이 이미 실행된 후 도착한 stream → 즉시 해제.
          stream.getTracks().forEach((t) => {
            try {
              t.stop()
            } catch {}
          })
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        if (disposed) return
        console.error(e)
        if (e instanceof Error) {
          if (e.name === 'NotAllowedError') {
            alert(
              '카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.',
            )
            return
          } else if (
            e.name === 'NotFoundError' ||
            e.name === 'DevicesNotFoundError'
          ) {
            alert('사용 가능한 카메라가 없습니다.')
          } else {
            alert('카메라 접근 중 알 수 없는 오류가 발생했습니다.')
          }
        }
        router.back()
      }
    }

    setupStream()

    const url = env('NEXT_PUBLIC_SOCKET_URL') ?? ''
    if (url) {
      uploadSocketRef.current = io(url, { withCredentials: true })
    }

    return () => {
      disposed = true
      // recorder + cloned track 먼저 해제 (원본 stream tracks 정지 전에).
      teardownRecorder()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {}
        })
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      uploadSocketRef.current?.disconnect()
      uploadSocketRef.current = null
    }
    // router 는 Next.js 의 안정 ref. teardownRecorder 는 closure 안에서만 사용.
  }, [router])

  async function startRec() {
    if (!streamRef.current) {
      console.error('stream이 존재하지 않습니다')
      return
    }
    // 직전 step 의 recorder 가 남아 있으면 cloned track 까지 해제.
    teardownRecorder()

    const v = streamRef.current.getVideoTracks()[0]
    const recVideo = v.clone()
    await recVideo.applyConstraints({
      width: 1280,
      height: 720,
      frameRate: { ideal: 1, max: 1 },
    })
    const recStream = new MediaStream([recVideo])
    const rec = new MediaRecorder(recStream)

    let index = 0

    rec.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
        const arrayBuffer = await e.data.arrayBuffer()
        uploadSocketRef.current?.emit('client:upload-chunk', {
          stepId,
          chunk: arrayBuffer,
          index: index++,
        })
      }
    }

    rec.onstop = () => {
      try {
        uploadSocketRef.current?.emit('client:upload-finish', {
          stepId,
          type: rec.mimeType,
        })
        chunksRef.current = []
      } catch (e) {
        console.error(e)
      }
      // rec 종료 시점에 cloned track 도 즉시 해제 (카메라 indicator).
      recStream.getTracks().forEach((t) => {
        try {
          t.stop()
        } catch {}
      })
      if (recStreamRef.current === recStream) recStreamRef.current = null
      if (recordRef.current === rec) recordRef.current = null
    }

    recordRef.current = rec
    recStreamRef.current = recStream
    rec.start(1000)
  }

  async function stopRec() {
    const rec = recordRef.current
    if (rec) {
      try {
        if (rec.state !== 'inactive') rec.stop()
      } catch {}
    }
  }

  useEffect(() => {
    const handleRecording = async () => {
      if (startAt && !endAt) {
        await stopRec()
        startRec()
      } else {
        await stopRec()
      }
    }
    handleRecording()
  }, [startAt, endAt])

  return (
    <video
      ref={videoRef}
      className="w-full aspect-[16/9] bg-gray-500 rounded-[10px]"
    ></video>
  )
}
