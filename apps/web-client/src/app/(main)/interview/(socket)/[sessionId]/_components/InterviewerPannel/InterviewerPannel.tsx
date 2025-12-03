'use client'

import { useEffect, useRef, useState } from 'react'

import Interviewer from './Interviewer'
import InterviewerSubtitle from './InterviewerSubtitle'
import InterviewHeader from './InterviewHeader'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function InterviewerPannel({
  sessionId,
  className,
  title,
}: {
  sessionId: string
  className?: string
  title: string
}) {
  const currentQuestion = useInterviewStore((state) => state.current)

  const [isSpeaking, setIsSpeaking] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!sessionId || !currentQuestion) return

    useSttStore.getState().connect(sessionId, currentQuestion.sttToken)

    if (currentQuestion?.audioBase64) {
      const audio = new Audio(
        `data:audio/mp3;base64,${currentQuestion.audioBase64}`,
      )
      audioRef.current = audio
      //화면이 실행될 때 자동 재생 시도
      //브라우저 정책에 따라 실패 가능
      //실패시 버튼으로 클릭할 수 있도록 함
      audio
        .play()
        .then(() => setIsSpeaking(true))
        .catch(() => {
          setIsSpeaking(false)
        })
    }

    return () => {
      useSttStore.getState().disconnect()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [currentQuestion])

  return (
    <section
      className={`w-full h-full flex flex-col p-24 bg-neutral-card rounded-[20px] shadow-box ${className}`}
    >
      <InterviewHeader title={title} />
      <div className="w-full min-h-0 flex-1 flex flex-col gap-16">
        <Interviewer>
          {!isSpeaking && (
            <button onClick={() => audioRef.current?.play()}>stt start</button>
          )}
        </Interviewer>
        <InterviewerSubtitle className="min-h-0 flex-1">
          {currentQuestion?.text}
        </InterviewerSubtitle>
      </div>
    </section>
  )
}
