// lib/socket.ts
'use client'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

// 더 이상 인자를 받지 않도록 단순화
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be used in a client environment.')
  }

  // 이미 연결된 소켓이 있으면 재사용
  if (socket) return socket

  try {
    //cookie로 소켓 인증 설정
    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
      {
        withCredentials: true,
      },
    )

    newSocket.on('connect', () => {
      console.log('[socket] connected', newSocket.id)
    })
    newSocket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', reason)
      socket = null
    })
    newSocket.on('connect_error', (err) => {
      console.error('[socket] error', err?.message)
      socket = null
    })

    socket = newSocket
    return socket
  } catch (error) {
    console.error('Error initializing socket:', error)
    throw error
  }
}

export function destroySocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
