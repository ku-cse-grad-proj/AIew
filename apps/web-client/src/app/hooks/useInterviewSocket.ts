'use client'
import { useEffect, useState } from 'react'

import { getSocket, destroySocket } from '../lib/socket'

// 최종 이벤트 payload
export interface QuestionsReadyPayload {
  questions: QuestionsMap
}

// 소켓 이벤트 전체 객체
export interface QuestionsReadyEvent {
  type: QuestionsEventType // 'server:questions-ready'
  payload: QuestionsReadyPayload
}

export function useInterviewSocket(sessionId?: string) {
  const socket = getSocket({ sessionId })
  const [isQuestionsReady, setIsQuestionsReady] = useState(false)

  useEffect(() => {
    if (!socket) return
    if (sessionId) socket.emit('client:identify', { sessionId })

    const handleQuestionsReady = (data: QuestionsReadyEvent) => {
      console.log('Questions are ready:', data)
      setIsQuestionsReady(true)
    }

    socket.on('server:questions-ready', handleQuestionsReady)

    socket.emit('client:ready', () => {
      console.log('client ready')
    })

    return () => {
      socket.off('server:questions-ready', handleQuestionsReady)
      socket.off('client:ready')
    }
  }, [socket, sessionId])

  return {
    socket,
    destroySocket,
    isConnected: !!socket?.connected,
    isQuestionsReady,
  }
}
