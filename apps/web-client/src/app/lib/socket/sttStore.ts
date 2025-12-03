import { create } from 'zustand'

type sttState = {
  isSessionActive: boolean
  events: RealtimeEvent[]
  sentences: string
  isMicPaused: boolean
  canStopSession: boolean
  setSentences: (sentence: string) => void
  connect: (sessionId: string, sttToken: string) => Promise<void>
  disconnect: () => void
  pauseMic: () => void
  resumeMic: () => void
}

type RealtimeEvent = {
  type: string
  event_id?: string
  timestamp?: string
  transcript?: string
} & Record<string, string>

let isConnecting = false
let lastestItemId = ''
let peerConnection: RTCPeerConnection | null
let mediaStream: MediaStream | null
let dataChannel: RTCDataChannel | null

export const useSttStore = create<sttState>((set, get, store) => ({
  isSessionActive: false,
  events: [],
  sentences: '',
  isMicPaused: true,
  canStopSession: true,

  setSentences: (sentence: string) => set({ sentences: sentence }),
  pauseMic: () => {
    const track = mediaStream?.getAudioTracks?.()[0]
    if (!track) {
      console.warn('No local audio track to pause')
      return
    }
    track.enabled = false
    set({ isMicPaused: true })
  },

  resumeMic: () => {
    const track = mediaStream?.getAudioTracks?.()[0]
    if (!track) {
      console.warn('No local audio track to resume')
      return
    }
    track.enabled = true
    // setIsMicPaused(false)
    set({ isMicPaused: false })
  },

  disconnect: () => {
    //이미 종료된 상태면 무시
    if (!(dataChannel || peerConnection || mediaStream)) return

    // if (!get().canStopSession) {
    //   new Error('세션은 모든 작업이 완료된 후에 종료할 수 있습니다')
    // }

    if (dataChannel) {
      dataChannel.close()
    }

    if (peerConnection) {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop()
        }
      })
      peerConnection.close()
    }

    stopAllTracks(mediaStream)

    mediaStream = null
    peerConnection = null
    dataChannel = null
    lastestItemId = ''
    set(store.getInitialState())
  },

  connect: async (sessionId: string, sttToken: string) => {
    if (isConnecting) {
      return
    }

    isConnecting = true

    //만약 session이 존재하면 연결을 끊는다
    if (peerConnection || dataChannel) get().disconnect()

    if (!sttToken) {
      console.error(
        'sttToken이 없습니다. stt 서비스를 이용하기 위해 token값이 필요합니다',
      )
      throw Error('sttToken 값이 없습니다')
    }
    const EPHEMERAL_KEY = sttToken

    // Create a peer connection
    const pc = new RTCPeerConnection()

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })

    // Start muted by default: disable the track BEFORE adding to the PeerConnection
    const micTrack = ms.getAudioTracks()[0]
    if (micTrack) {
      micTrack.enabled = false
      set({ isMicPaused: true })
      pc.addTrack(micTrack)
    } else {
      console.warn('No audio track found from getUserMedia')
    }

    // Set up data channel for sending and receiving events
    const dc: RTCDataChannel = pc.createDataChannel('oai-events')

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    //OpenAi와 WebRTC 연결 시도
    //이 때 back에서 session 설정을 잘못하면 연결 실패함
    const baseUrl = 'https://api.openai.com/v1/realtime/calls'
    const sdpResponse = await fetch(`${baseUrl}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        'Content-Type': 'application/sdp',
      },
    })

    const sdp = await sdpResponse.text()
    const answer: RTCSessionDescriptionInit = { type: 'answer' as const, sdp }
    await pc.setRemoteDescription(answer)

    // Append new server events to the list
    dc.addEventListener('message', (e) => {
      const event = JSON.parse(e.data) as RealtimeEvent
      if (!event.timestamp) {
        event.timestamp = new Date().toLocaleTimeString()
      }

      //   setEvents((prev) => [event, ...prev])
      set((prev) => ({ events: [event, ...prev.events] }))

      if (
        event.type === 'conversation.item.input_audio_transcription.completed'
      ) {
        // setSentences((prev) => prev + ' ' + event.transcript)
        set((prev) => ({ sentences: prev.sentences + ' ' + event.transcript }))

        //모든 문장이 transcription 되어야지 session을 종료할 수 있음
        if (event.item_id === lastestItemId) {
          //   setCanStopSession(true)
          set({ canStopSession: true })
        }
      } else if (event.type === 'input_audio_buffer.speech_started') {
        lastestItemId = event.item_id
        // setCanStopSession(false)
        set({ canStopSession: false })
      }
    })

    // Set session active when the data channel is opened
    dc.addEventListener('open', () => {
      //   setIsSessionActive(true)
      //   setEvents([])
      set({ isSessionActive: true, events: [] })
    })

    peerConnection = pc
    mediaStream = ms
    dataChannel = dc

    isConnecting = false
  },
}))

// 모든 트랙을 안전하게 중지하는 유틸
function stopAllTracks(stream?: MediaStream | null) {
  if (!stream) return
  const tracks = stream.getTracks?.() ?? []
  tracks.forEach((t) => {
    try {
      t.stop()
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('track.stop() failed', e)
      }
    }
    try {
      stream.removeTrack?.(t)
    } catch {}
  })
}
