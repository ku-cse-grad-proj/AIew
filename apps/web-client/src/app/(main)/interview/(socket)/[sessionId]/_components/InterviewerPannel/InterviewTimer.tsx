'use client'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'

export default function InterviewTimer() {
  const { elapsedSec, setElapsedSec } = useInterviewStore(
    useShallow((state) => ({
      elapsedSec: state.elapsedSec,
      setElapsedSec: state.setElapsedSec,
    })),
  )

  // 타이머 시작 시점
  const startAtRef = useRef(elapsedSec ?? 0)

  // 서버로부터 elapsedSec가 업데이트되면 타이머 시작 시점 보정
  useEffect(() => {
    startAtRef.current = Date.now() - elapsedSec * 1000
  }, [elapsedSec])

  // 0.5초마다 경과 시간 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startAtRef.current) / 1000))
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [setElapsedSec])

  const min = String(Math.floor(elapsedSec / 60)).padStart(2, '0')
  const sec = String(elapsedSec % 60).padStart(2, '0')
  const hour = String(Math.floor(elapsedSec / 3600)).padStart(2, '0')

  return (
    <div className="px-10 py-6 inline-flex items-center gap-4 rounded-[10px] bg-neutral-background">
      <Image
        src={'/icons/hourglass.svg'}
        alt={'hourglass image'}
        width={20}
        height={20}
      />
      <span className="font-medium font-mono">
        {hour != '00' && `${hour}:`}
        {min}:{sec}
      </span>
    </div>
  )
}
