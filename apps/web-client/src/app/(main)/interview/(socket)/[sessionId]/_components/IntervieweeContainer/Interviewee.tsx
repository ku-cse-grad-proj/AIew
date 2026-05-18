'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import type { AnyActorRef } from 'xstate'

import type { CameraActorMessage } from '../../_machine/actors/cameraActor'
import { InterviewContext } from '../../_machine/interviewContext'

/**
 * AIEW-237 후속 — 카메라/MediaRecorder/업로드 socket lifecycle 리팩토링.
 *
 * 옛 구조: 이 컴포넌트가 `getUserMedia({video})` + `MediaRecorder` + 자체
 * upload socket 을 useEffect 라이프사이클로 관리했고, async race / cloned
 * track leak 을 c2aa07f 의 disposed 플래그로 부분 차단.
 *
 * 새 구조: 위 모든 비동기 인스턴스는 머신의 cameraActor 가 소유.
 *   1. video element ref → ATTACH_VIDEO 로 actor 에 전달
 *   2. startAt/endAt 변화 → START/STOP_RECORDING 명령
 *   3. cameraError context 를 selector 로 구독해 alert + router.back
 * 만 수행한다. stream / recorder / cloned track / upload socket lifecycle
 * 은 actor cleanup 계약이 책임.
 *
 * 결과: c2aa07f 의 disposed race 가 actor invoke lifecycle 위임으로 자동
 * 해소. 카메라 indicator 누수가 구조적으로 차단됨.
 */
export default function Interviewee() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
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
  const cameraError = InterviewContext.useSelector(
    (state) => state.context.cameraError,
  )

  // 머신에 invoke 된 cameraActor 의 ref. xstate v5 의 state.children 으로 접근.
  // 머신 root 의 `invoke.id: 'cameraActor'` 와 일치.
  const cameraRef = InterviewContext.useSelector(
    (state) =>
      (state.children as Record<string, AnyActorRef | undefined>).cameraActor,
  )

  // 권한 오류 / 디바이스 부재 시 UX 처리. cameraActor 가 sendBack 한 이벤트가
  // 머신 context.cameraError 에 assign 되고, 이 useEffect 가 한 번 dispatch.
  // 한 번 표시 후에는 사용자가 새 세션을 시작하지 않는 한 동일 reason 으로
  // 다시 trigger 되지 않으므로 dedup 은 컴포넌트 마운트 lifetime 한정으로 충분.
  const alertedRef = useRef(false)
  useEffect(() => {
    if (!cameraError || alertedRef.current) return
    alertedRef.current = true
    if (cameraError === 'permission') {
      alert('카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.')
      return
    }
    if (cameraError === 'not-found') {
      alert('사용 가능한 카메라가 없습니다.')
      router.back()
      return
    }
    alert('카메라 접근 중 알 수 없는 오류가 발생했습니다.')
    router.back()
  }, [cameraError, router])

  // video element 마운트 시 actor 에 attach. unmount 시 detach.
  // 컴포넌트가 unmount 돼도 actor 는 머신 lifecycle 동안 살아 있으므로 stream 은
  // 보존되고, 다시 mount 되면 동일 element 에 srcObject 재할당만 발생.
  useEffect(() => {
    const element = videoRef.current
    if (!cameraRef || !element) return
    cameraRef.send({
      type: 'ATTACH_VIDEO',
      element,
    } satisfies CameraActorMessage)
    return () => {
      cameraRef.send({ type: 'DETACH_VIDEO' } satisfies CameraActorMessage)
    }
  }, [cameraRef])

  // startAt/endAt 변화에 따라 녹화 시작/종료. 옛 startRec/stopRec 와 동일 시맨틱
  // 이나 cloned-track lifecycle 은 actor 의 책임.
  useEffect(() => {
    if (!cameraRef) return
    if (startAt && !endAt) {
      // 직전 step recorder 가 남아있으면 actor 가 teardownRecorder 로 해제 후 재시작.
      cameraRef.send({ type: 'STOP_RECORDING' } satisfies CameraActorMessage)
      cameraRef.send({
        type: 'START_RECORDING',
        stepId,
      } satisfies CameraActorMessage)
    } else {
      cameraRef.send({ type: 'STOP_RECORDING' } satisfies CameraActorMessage)
    }
  }, [cameraRef, stepId, startAt, endAt])

  return (
    <video
      ref={videoRef}
      className="w-full aspect-[16/9] bg-gray-500 rounded-[10px]"
    ></video>
  )
}
