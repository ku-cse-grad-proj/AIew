import { create } from 'zustand'

import { privateFetch } from '../fetch'
type sttState = {
  isSessionActive: boolean
  events: RealtimeEvent[]
  sentences: string
  isMicPaused: boolean
  canStopSession: boolean
  connect: (sessionId: string) => void
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

let lastestItemId = ''
let peerConnection: RTCPeerConnection | null
let mediaStream: MediaStream | null
let dataChannel: RTCDataChannel | null

export const useSttStore = create<sttState>((set, get, store) => ({
  isSessionActive: false,
  events: [],
  sentences: '',
  isMicPaused: true,
  canStopSession: false,
  pauseMic: () => {
    const track = mediaStream?.getAudioTracks?.()[0]
    if (!track) {
      console.warn('No local audio track to pause')
      return
    }
    track.enabled = false
    set({ isMicPaused: true })
    console.log('마이크 종료')
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
    if (!get().canStopSession) {
      new Error('세션은 모든 작업이 완료된 후에 종료할 수 있습니다')
    }

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

    mediaStream = null
    peerConnection = null
    dataChannel = null
    lastestItemId = ''
    set(store.getInitialState())
  },

  connect: async (sessionId: string) => {
    //만약 session이 존재하면 연결을 끊는다
    if (peerConnection || dataChannel) get().disconnect()

    //Back에서 EPHEMERAL_KEY를 발급 받는다.
    const response = await privateFetch(
      process.env.NEXT_PUBLIC_API_BASE +
        '/interviews/' +
        sessionId +
        '/stt-token',
    )
    const { data } = await response.json()
    const EPHEMERAL_KEY = data.value

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
        console.log(event.transcript)

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
  },
}))
