'use client'
import { io, type Socket } from 'socket.io-client'
import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * AIEW-237 후속 — 카메라 stream / cloned video track / MediaRecorder lifecycle 을
 * 머신 안으로 포섭하는 callback actor.
 *
 * 옛 구조에서는 `Interviewee.tsx` 컴포넌트 안에서 `getUserMedia({video})` 호출 +
 * `MediaRecorder` + 자체 upload socket 을 모두 React useEffect 의 lifecycle 에
 * 묶었다. 이 패턴은 다음 race 들을 노출했다 (c2aa07f 에서 disposed 플래그로
 * 부분 수정).
 *
 * 1. React 19 / Next.js dev 이중 effect — cleanup 이 getUserMedia resolve 전에
 *    실행되면 늦게 도착한 MediaStream 이 streamRef 에 할당돼 leak.
 * 2. MediaRecorder 의 cloned video track — `rec.stop()` 만으로는 clone track 이
 *    해제되지 않아 카메라 indicator 가 켜진 상태로 남는다.
 * 3. unmount 시 녹화 중인 recorder + cloned track 동시 해제 필요.
 *
 * cameraActor 로 캡슐화하면 위 race 들이 actor invoke lifecycle 의 cleanup
 * 계약 (xstate v5 의 fromCallback return) 에 자동 위임된다. closure 안의
 * disposed 플래그 + receive 패턴은 다른 actor (socketActor.ts:66,
 * sttActor.ts:49) 와 동일한 모양으로 통일.
 *
 * 마이크는 `pc.addTrack` 으로 RTCPeerConnection 과 inseparable 결합이라
 * sttActor 안에 유지. 카메라는 STT 흐름과 무관한 독립 도메인이므로 분리.
 *
 * 머신 통합:
 * - session level 에서 invoke (notConnected/connected/step/stepFinished 전체
 *   기간 유지). interviewFinished 진입 시 자동 cleanup.
 * - 머신 흐름에는 영향 주지 않음 (CAMERA_ERROR 는 머신이 무시, Interviewee.tsx
 *   가 actor snapshot 을 구독해 alert/router.back).
 * - 머신 → actor 메시지: ATTACH_VIDEO / DETACH_VIDEO / START_RECORDING /
 *   STOP_RECORDING. Interviewee.tsx 가 system.get('cameraActor') 로 ref 를
 *   얻어 송신.
 */

export type CameraActorInput = {
  /** 비디오 chunk upload 용 socket URL. 빈 문자열이면 upload 비활성. */
  uploadUrl: string
}

export type CameraActorMessage =
  | { type: 'ATTACH_VIDEO'; element: HTMLVideoElement }
  | { type: 'DETACH_VIDEO' }
  | { type: 'START_RECORDING'; stepId: string }
  | { type: 'STOP_RECORDING' }

export const cameraActor = fromCallback<
  InterviewEvent | CameraActorMessage,
  CameraActorInput
>(({ input, sendBack, receive }) => {
  const { uploadUrl } = input

  // closure 상태 — Interviewee.tsx 의 useRef 들을 모두 흡수
  let stream: MediaStream | null = null
  let videoElement: HTMLVideoElement | null = null
  let recorder: MediaRecorder | null = null
  let recStream: MediaStream | null = null
  let uploadSocket: Socket | null = null
  let disposed = false

  // upload socket 은 actor lifecycle 와 동일 — 한 면접 세션 동안 1개.
  if (uploadUrl) {
    uploadSocket = io(uploadUrl, { withCredentials: true })
  }

  /**
   * recorder + cloned video track 을 안전하게 stop.
   * Interviewee.tsx 의 teardownRecorder 와 동일한 시맨틱. rec.stop() 만으로는
   * 입력 MediaStream 의 track 이 살아남아 카메라 indicator 가 꺼지지 않으므로
   * recStream tracks 를 명시 stop.
   */
  const teardownRecorder = () => {
    if (recorder) {
      try {
        if (recorder.state !== 'inactive') recorder.stop()
      } catch {}
    }
    recorder = null

    if (recStream) {
      recStream.getTracks().forEach((t) => {
        try {
          t.stop()
        } catch {}
      })
    }
    recStream = null
  }

  const attachToVideoElement = () => {
    if (!stream || !videoElement) return
    videoElement.srcObject = stream
    void videoElement.play().catch(() => {})
  }

  // getUserMedia lifecycle — 즉시 시작. React 컴포넌트 lifecycle 과 무관하게
  // actor invoke 시점에 stream 확보. await race 는 disposed 플래그로 차단.
  ;(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      if (!disposed) {
        sendBack({ type: 'CAMERA_ERROR', reason: 'not-found' })
      }
      return
    }

    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      })
      if (disposed) {
        // cleanup 이 resolve 전에 실행됨 → 늦게 도착한 stream 즉시 해제.
        ms.getTracks().forEach((t) => {
          try {
            t.stop()
          } catch {}
        })
        return
      }
      stream = ms
      attachToVideoElement()
      sendBack({ type: 'CAMERA_READY' })
    } catch (e) {
      if (disposed) return
      let reason: 'permission' | 'not-found' | 'unknown' = 'unknown'
      if (e instanceof Error) {
        if (e.name === 'NotAllowedError') reason = 'permission'
        else if (
          e.name === 'NotFoundError' ||
          e.name === 'DevicesNotFoundError'
        )
          reason = 'not-found'
      }
      sendBack({ type: 'CAMERA_ERROR', reason })
    }
  })()

  receive((event) => {
    if (event.type === 'ATTACH_VIDEO') {
      videoElement = event.element
      attachToVideoElement()
      return
    }
    if (event.type === 'DETACH_VIDEO') {
      if (videoElement) videoElement.srcObject = null
      videoElement = null
      return
    }
    if (event.type === 'START_RECORDING') {
      if (!stream) return
      // 직전 step 의 recorder 가 남아 있으면 cloned track 까지 해제.
      teardownRecorder()

      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) return
      const recVideo = videoTrack.clone()
      void recVideo.applyConstraints({
        width: 1280,
        height: 720,
        frameRate: { ideal: 1, max: 1 },
      })
      const newRecStream = new MediaStream([recVideo])
      const newRec = new MediaRecorder(newRecStream)
      const stepId = event.stepId
      let index = 0

      newRec.ondataavailable = async (e) => {
        if (!e.data || e.data.size <= 0) return
        if (disposed) return
        const arrayBuffer = await e.data.arrayBuffer()
        uploadSocket?.emit('client:upload-chunk', {
          stepId,
          chunk: arrayBuffer,
          index: index++,
        })
      }

      newRec.onstop = () => {
        try {
          uploadSocket?.emit('client:upload-finish', {
            stepId,
            type: newRec.mimeType,
          })
        } catch {}
        // rec 종료 시점에 cloned track 도 즉시 해제 (카메라 indicator).
        newRecStream.getTracks().forEach((t) => {
          try {
            t.stop()
          } catch {}
        })
        if (recStream === newRecStream) recStream = null
        if (recorder === newRec) recorder = null
      }

      recorder = newRec
      recStream = newRecStream
      newRec.start(1000)
      return
    }
    if (event.type === 'STOP_RECORDING') {
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {}
      }
      return
    }
  })

  return () => {
    disposed = true
    // recorder + cloned track 먼저 해제 (원본 stream tracks 정지 전에).
    teardownRecorder()
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop()
        } catch {}
      })
      stream = null
    }
    if (videoElement) {
      try {
        videoElement.srcObject = null
      } catch {}
      videoElement = null
    }
    if (uploadSocket) {
      try {
        uploadSocket.removeAllListeners()
        uploadSocket.disconnect()
        uploadSocket.close()
      } catch {}
      uploadSocket = null
    }
  }
})
