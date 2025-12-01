'use client'
import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

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

export function useInterviewSocket(sessionId: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isQuestionsReady, setIsQuestionsReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let isMounted = true

    const setupSocket = async () => {
      try {
        const socketInstance = getSocket()

        if (isMounted) {
          setSocket(socketInstance)
          setIsConnected(socketInstance.connected)

          socketInstance.on('connect', () => {
            setIsConnected(true)
            // 연결 성공 후 방에 참여
            socketInstance.emit('client:join-room', { sessionId })
          })

          socketInstance.on('disconnect', () => {
            setIsConnected(false)
          })

          const handleQuestionsReady = (data: QuestionsReadyEvent) => {
            console.log('Questions are ready', data)
            setIsQuestionsReady(true)
          }

          socketInstance.on('server:questions-ready', handleQuestionsReady)
          socketInstance.on('server:error', (error) => {
            console.error('Socket error:', error.message)
            // TODO: 사용자에게 에러 알림 UI 처리
          })

          // 이미 연결된 상태라면 바로 join-room emit
          if (socketInstance.connected) {
            socketInstance.emit('client:join-room', { sessionId })
          }
        }
      } catch (error) {
        console.error('Failed to setup socket connection', error)
      }
    }

    setupSocket()

    return () => {
      isMounted = false
      // 컴포넌트 언마운트 시 리스너 정리
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('server:questions-ready')
        socket.off('server:error')
      }
      // destroySocket은 앱 전체에서 소켓을 공유하므로,
      // 페이지를 나갈 때마다 호출할지 여부는 정책에 따라 결정.
      // 여기서는 호출하여 페이지를 벗어나면 연결이 끊기도록 함.
      destroySocket()
    }
  }, [sessionId])

  return {
    socket,
    destroySocket,
    isConnected,
    isQuestionsReady,
  }
}
