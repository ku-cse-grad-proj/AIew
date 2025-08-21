'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export default function FooterButtons({
  sessionId,
  isWaiting = false,
  onClick,
}: {
  sessionId?: string
  isWaiting?: boolean
  onClick?: () => void
}) {
  const router = useRouter()
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    console.log('FooterButtons mounted with sessionId:', sessionId)
    if (sessionId) {
      try {
        const socket = io('http://localhost:3000', {
          query: { sessionId },
        })
        socketRef.current = socket
        console.log('Socket connected:', socket.id)

        socket.on('connect', () => {
          console.log('Socket connected:', socket.id)
        })

        socket.on('server:questions-ready', (data) => {
          console.log('Questions are ready:', data)
        })

        socket.emit('client:ready', () => {
          console.log('client ready')
        })

        socket.on('disconnect', () => {
          console.log('Socket disconnected')
        })
      } catch (error) {
        console.error('면접 생성 실패:', error)
      }
    }
  }, [sessionId])
  return (
    <div className="w-full h-48 flex gap-24 flex-none">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex-3 rounded-[10px] border border-dark text-dark hover:shadow-md hover:cursor-pointer"
      >
        back
      </button>
      <button
        type={isWaiting ? 'button' : 'submit'}
        disabled={isWaiting}
        onClick={onClick}
        className="flex-7 rounded-[10px] bg-navy text-bright hover:shadow-xl hover:cursor-pointer"
      >
        {isWaiting ? 'start interview' : 'create interview'}
      </button>
    </div>
  )
}
