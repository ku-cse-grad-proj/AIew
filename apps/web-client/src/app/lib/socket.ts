// lib/socket.ts
'use client'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let connectedSessionId: string | null = null

export function getSocket({
  sessionId,
}: { sessionId?: string } = {}): Socket | null {
  if (typeof window === 'undefined') return null
  // 새로운 seesionId가 기존 sessionId와 다를 경우 기존 소켓을 제거
  if (sessionId && connectedSessionId !== sessionId) {
    destroySocket()
    connectedSessionId = sessionId
  }
  // 이미 소켓이 연결되어 있다면 재사용
  if (socket) return socket

  // socket이 없으면서 sessionId가 없으면 error 처리
  if (!sessionId) {
    console.warn('No sessionId provided, socket will not be created.')
    return null
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000', {
    query: { sessionId },
  })

  connectedSessionId = sessionId

  socket.on('connect', () => console.log('[socket] connected', socket?.id))
  socket.on('disconnect', (reason) =>
    console.log('[socket] disconnected', reason),
  )

  socket.on('connect_error', (err) =>
    console.error('[socket] error', err?.message),
  )

  return socket
}

export function destroySocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
