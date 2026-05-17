'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { InterviewContext } from '../../_machine/interviewContext'

/**
 * Phase 2.2 — Zustand 기반 elapsedSec setter 제거.
 *
 * - 서버에서 받은 `elapsedSec` (CONNECT 시점 갱신) 을 기준으로 화면 표시.
 * - 0.5 초 마다 view-only 로 다시 그림.
 * - 서버 동기화는 머신의 `elapsedTickActor` 가 1초 주기로 처리하므로 본 컴포넌트는
 *   순수 표시 로직만 담당.
 */
export default function InterviewTimer() {
  const elapsedSec = InterviewContext.useSelector(
    (state) => state.context.elapsedSec,
  )

  // 시작 시점 보정 — 서버에서 받은 elapsedSec 가 갱신될 때 reset
  const startAtRef = useRef(Date.now() - elapsedSec * 1000)
  const [displayed, setDisplayed] = useState(elapsedSec)

  useEffect(() => {
    startAtRef.current = Date.now() - elapsedSec * 1000
    setDisplayed(elapsedSec)
  }, [elapsedSec])

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayed(Math.floor((Date.now() - startAtRef.current) / 1000))
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const min = String(Math.floor(displayed / 60)).padStart(2, '0')
  const sec = String(displayed % 60).padStart(2, '0')
  const hour = String(Math.floor(displayed / 3600)).padStart(2, '0')

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
