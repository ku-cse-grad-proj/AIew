'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function Interviewee() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream
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
  return (
    <video
      ref={videoRef}
      className="w-full aspect-[16/9] bg-gray-500 rounded-[10px]"
    ></video>
  )
}
