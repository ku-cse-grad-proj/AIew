'use client'

import { useEffect, useRef, useState } from 'react'

import { useInterviewStore } from '@/app/lib/socket/interviewStore'
import { useSttStore } from '@/app/lib/socket/sttStore'

export default function InterviewerPannel({
  sessionId,
}: {
  sessionId: string
}) {
  const currentQuestion = useInterviewStore((state) => state.current)
  const [isSpeaking, setIsSpeaking] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!sessionId || !currentQuestion) return

    useSttStore.getState().connect(sessionId)

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
        .catch((err) => {
          setIsSpeaking(false)
          console.log('audio autoplay error', err)
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
    <div>
      {!isSpeaking && (
        <button onClick={() => audioRef.current?.play()}>stt start</button>
      )}
      <p>{currentQuestion?.text}</p>
    </div>
  )
}
