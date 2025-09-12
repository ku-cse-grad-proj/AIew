// lib/socket.ts
'use client'
import { io, Socket } from 'socket.io-client'

import { ClientEvent, IInterviewSocket, ServerEvent } from './types'

//IInterviewSocket을 기준으로 구현
export class InterviewSocket implements IInterviewSocket {
  private socket: Socket | null = null
  connect(url: string, sessionId: string): void {
    //socket이 존재하면 sessionId를 이용해 접속
    if (this.socket && this.socket.connected) {
      this.emit('client:join-room', { sessionId })
      return
    }

    //쿠키와 함께 socket 연결
    const newSocket = io(url, { withCredentials: true })
    newSocket.on('connect', () => {
      newSocket.emit('client:join-room', { sessionId })
    })

    this.socket = newSocket
  }

  disconnect(): void {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
  }

  on(event: ServerEvent, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback)
  }
  emit(event: ClientEvent, payload: unknown): void {
    this.socket?.emit(event, payload)
  }
}

export const interviewSocket = new InterviewSocket()
