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
  // React 19 / Next.js dev 이중 effect 로 actor 가 두 번 invoke 되는 경우,
  // 첫 번째 actor 의 비동기 SDP 협상이 cleanup 이후에 완료되면 stale
  // RTCPeerConnection / MediaStream 이 살아남는다. disposed 플래그로 cleanup
  // 이후의 SDP 후처리 / DataChannel 콜백 / sendBack 을 전면 차단.
  // (socketActor.ts:66 의 disposed 패턴과 동일.)
  let disposed = false

  const cleanup = () => {
    disposed = true
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

      if (disposed) {
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

      // DataChannel listener 는 SDP 협상 시작 전(=createDataChannel 직후)에
      // 등록해야 한다. setRemoteDescription 이후 ICE/DTLS 가 빠르게 완료되면
      // 'open' 이벤트가 listener 등록 시점보다 먼저 발생할 수 있고, 그 경우
      // STT_READY 가 영원히 머신에 전달되지 않아 마이크 버튼이 활성화되지
      // 않는다. (옛 sttStore 의 회귀 케이스.)
      newDc.addEventListener('message', (e) => {
        if (disposed) return
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
        if (disposed) return
        sendBack({ type: 'STT_READY' })
      })

      // 협상 시작 전에 closure 에 ref 보관 → cleanup 이 중간에 호출되면
      // 정상적으로 close 가 호출되도록.
      pc = newPc
      mediaStream = ms
      dc = newDc

      const offer = await newPc.createOffer()
      if (disposed) return
      await newPc.setLocalDescription(offer)
      if (disposed) return

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
      if (disposed) return
      const answer: RTCSessionDescriptionInit = {
        type: 'answer' as const,
        sdp,
      }
      await newPc.setRemoteDescription(answer)
      // setRemoteDescription 이후 ICE/DTLS 가 비동기 시작되며, DataChannel
      // 'open' 이벤트는 위에 이미 등록된 listener 가 받는다.
    } catch (e) {
      if (disposed) return
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
      // STT 전사 완료까지 기다리기 위해 track.stop() 은 호출하지 않는다.
      // enabled=false 로 마이크 입력은 즉시 차단되며, RTCPeerConnection /
      // DataChannel / track 의 readyState='live' 는 유지되어 OpenAI Realtime
      // 서버가 buffer 에 남은 audio 의 transcription 을 정상적으로 push.
      //
      // 실제 track.stop() / pc.close() 는 sttActor 의 cleanup 에서 수행되며,
      // cleanup 은 step 종료 시점 (= answering.parallel onDone =
      // finishing.done ∧ stt.done = STT_FINISH 도착 후) 에 트리거되므로
      // 마지막 transcription 결과를 누락하지 않는다. Chrome 마이크 indicator
      // 도 그 시점에 OFF — 사용자 입장에서는 "처리 중..." 표시 동안 indicator
      // 가 잠시 켜진 상태가 자연스러우며 "전사 완료까지 기다린다" 는 의도와
      // 일치한다.
      if (track) track.enabled = false
      return
    }
  })

  // canStopSession 은 현재 머신에서 직접 참조하지 않으나, 외부 디버깅을 위해 참조 유지
  void canStopSession

  return cleanup
})
