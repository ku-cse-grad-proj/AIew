'use client'
import { fromCallback } from 'xstate'

import type { InterviewEvent } from '../_types'

/**
 * OpenAI Realtime STT 용 RTCPeerConnection / MediaStream / DataChannel lifecycle.
 *
 * - input.sttToken 으로 OpenAI Realtime API SDP 교환
 * - DataChannel 메시지 → 머신 이벤트 변환
 * - 머신 → actor 메시지로 마이크 enable/disable
 * - cleanup: pc.close, tracks stop, dc.close
 *
 * 옛 `sttStore.ts:88-187` 의 connect 로직을 actor 안으로 이동.
 * 모듈 전역(peerConnection, mediaStream, dataChannel) 은 closure 로 격리.
 */

type RealtimeEvent = {
  type: string
  event_id?: string
  timestamp?: string
  transcript?: string
} & Record<string, string>

export type SttActorInput = { sttToken: string }

export type SttActorMessage =
  | { type: 'START_ANSWER' }
  | { type: 'FINISH_ANSWER' }

export const sttActor = fromCallback<
  InterviewEvent | SttActorMessage,
  SttActorInput
>(({ input, sendBack, receive }) => {
  const { sttToken } = input

  // closure 상태
  let pc: RTCPeerConnection | null = null
  let mediaStream: MediaStream | null = null
  let dc: RTCDataChannel | null = null
  let lastestItemId = ''
  let canStopSession = true
  let sentencesAcc = ''
  let cancelled = false

  const cleanup = () => {
    cancelled = true
    try {
      if (dc) dc.close()
    } catch {}
    try {
      if (pc) {
        pc.getSenders().forEach((sender) => {
          if (sender.track) {
            try {
              sender.track.stop()
            } catch {}
          }
        })
        pc.close()
      }
    } catch {}
    if (mediaStream) {
      const tracks = mediaStream.getTracks?.() ?? []
      tracks.forEach((t) => {
        try {
          t.stop()
        } catch {}
        try {
          mediaStream?.removeTrack?.(t)
        } catch {}
      })
    }
    dc = null
    pc = null
    mediaStream = null
  }

  ;(async () => {
    if (!sttToken) {
      sendBack({
        type: 'STT_ERROR',
        message: 'sttToken 값이 없습니다',
      })
      return
    }
    try {
      const newPc = new RTCPeerConnection()
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (cancelled) {
        ms.getTracks().forEach((t) => {
          try {
            t.stop()
          } catch {}
        })
        newPc.close()
        return
      }

      const micTrack = ms.getAudioTracks()[0]
      if (micTrack) {
        micTrack.enabled = false
        newPc.addTrack(micTrack)
      }

      const newDc = newPc.createDataChannel('oai-events')

      const offer = await newPc.createOffer()
      await newPc.setLocalDescription(offer)

      const baseUrl = 'https://api.openai.com/v1/realtime/calls'
      const sdpResponse = await fetch(`${baseUrl}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${sttToken}`,
          'Content-Type': 'application/sdp',
        },
      })
      const sdp = await sdpResponse.text()
      const answer: RTCSessionDescriptionInit = {
        type: 'answer' as const,
        sdp,
      }
      await newPc.setRemoteDescription(answer)

      if (cancelled) {
        try {
          newPc.close()
        } catch {}
        ms.getTracks().forEach((t) => {
          try {
            t.stop()
          } catch {}
        })
        return
      }

      newDc.addEventListener('message', (e) => {
        let event: RealtimeEvent
        try {
          event = JSON.parse(e.data) as RealtimeEvent
        } catch {
          return
        }
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString()
        }

        if (
          event.type === 'conversation.item.input_audio_transcription.completed'
        ) {
          sentencesAcc = sentencesAcc + ' ' + (event.transcript ?? '')
          sendBack({ type: 'STT_FINISH', sentences: sentencesAcc })
          if (event.item_id === lastestItemId) {
            canStopSession = true
          }
        } else if (event.type === 'input_audio_buffer.speech_started') {
          lastestItemId = event.item_id
          canStopSession = false
          sendBack({ type: 'TRANSCRIBE' })
        }
      })

      newDc.addEventListener('open', () => {
        sendBack({ type: 'STT_READY' })
      })

      pc = newPc
      mediaStream = ms
      dc = newDc
    } catch (e) {
      const message = e instanceof Error ? e.message : 'STT 연결에 실패했습니다'
      sendBack({ type: 'STT_ERROR', message })
    }
  })()

  receive((event) => {
    const track = mediaStream?.getAudioTracks?.()[0]
    if (event.type === 'START_ANSWER') {
      if (track) track.enabled = true
      return
    }
    if (event.type === 'FINISH_ANSWER') {
      if (track) track.enabled = false
      return
    }
  })

  // canStopSession 은 현재 머신에서 직접 참조하지 않으나, 외부 디버깅을 위해 참조 유지
  void canStopSession

  return cleanup
})
