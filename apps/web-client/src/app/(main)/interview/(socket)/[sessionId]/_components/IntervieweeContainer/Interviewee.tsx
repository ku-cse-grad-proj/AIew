'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAnswerStore } from '@/app/lib/answerStore'
import { interviewSocket } from '@/app/lib/socket/interviewSocket'

export default function Interviewee() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  //TODO:: redo일 때 어떻게 할지 고민할 것
  const { stepId, startAt, endAt } = useAnswerStore(
    useShallow((state) => ({
      stepId: state.stepId,
      startAt: state.startAt,
      endAt: state.endAt,
      isRedo: state.isRedo,
    })),
  )

  useEffect(() => {
    const setupStream = async () => {
      //브라우저가 장치를 접근하지 못할 때
      if (!navigator.mediaDevices?.getUserMedia) {
        alert(
          '해당 브라우저는 카메라/마이크를 지원하지 않아 interview를 진행할 수 없습니다',
        )
        router.back()
        return
      }

      if (streamRef.current) return

      try {
        //화면에 보이는 곳은 30frame으로 송출
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        })
        streamRef.current = stream
        //video component와 연결
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
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

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  async function startRec() {
    if (!streamRef.current) {
      console.error('stream이 존재하지 않습니다')
      return
    }

    //기존 stream을 복제해 1frame로 변환
    const v = streamRef.current.getVideoTracks()[0]
    const recVideo = v.clone()
    await recVideo.applyConstraints({
      width: 1280,
      height: 720,
      frameRate: { ideal: 1, max: 1 },
    }) // 또는 1fps
    const recStream = new MediaStream([recVideo])
    const rec = new MediaRecorder(recStream) //브라우저 default 값으로 mimeType 설정

    let index = 0

    rec.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
        console.log(e.data.size)
        const arrayBuffer = await e.data.arrayBuffer()
        interviewSocket.emit('client:upload-chunk', {
          stepId,
          chunk: arrayBuffer,
          index: index++,
        })
      }
    }

    rec.onstop = async () => {
      try {
        const fullBlob = new Blob(chunksRef.current, { type: rec.mimeType })
        const filename = `record-${crypto.randomUUID()}`
        const file = new File([fullBlob], filename, {
          type: rec.mimeType,
          lastModified: Date.now(),
        })

        interviewSocket.emit('client:upload-finish', {
          stepId,
          type: rec.mimeType,
        })

        //file download
        // const url = URL.createObjectURL(file)
        // const a = document.createElement('a')
        // a.href = url
        // a.download = filename
        // a.style.display = 'none'
        // document.body.appendChild(a)
        // a.click()

        console.log(file)
        chunksRef.current = []
      } catch (e) {
        console.error(e)
      }
    }

    recordRef.current = rec

    rec.start(1000)
  }

  async function stopRec() {
    if (recordRef.current) {
      recordRef.current.stop()
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
