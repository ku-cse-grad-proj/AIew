'use client'
import { useEffect, useRef, useState } from 'react'

import Card from '../../../_components/Card'

import EventLog from './EventLog'
import SessionControls from './SessionControls'

import { privateFetch } from '@/app/lib/fetch'

export default function Stt({ sessionId }: { sessionId: string }) {
  const [isSessionActive, setIsSessionActive] = useState(false)
  type RealtimeEvent = {
    type: string
    event_id?: string
    timestamp?: string
    transcript?: string
  } & Record<string, string>

  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const lastestItemId = useRef('')
  const [sentences, setSentences] = useState('')
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [isMicPaused, setIsMicPaused] = useState(false)
  const [canStopSession, setCanStopSession] = useState(true)

  async function startSession() {
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
    pc.addTrack(ms.getTracks()[0])

    // Set up data channel for sending and receiving events
    const dc: RTCDataChannel = pc.createDataChannel('oai-events')
    setDataChannel(dc)

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

    peerConnection.current = pc
    mediaStreamRef.current = ms
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close()
    }

    peerConnection.current?.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop()
      }
    })

    if (peerConnection.current) {
      peerConnection.current.close()
    }

    setIsSessionActive(false)
    setDataChannel(null)
    mediaStreamRef.current = null
    setIsMicPaused(false)
    lastestItemId.current = ''
    peerConnection.current = null
  }

  // Send a message to the model
  // function sendClientEvent(message: RealtimeEvent) {
  //   if (dataChannel) {
  //     console.log(message)
  //     const timestamp = new Date().toLocaleTimeString()
  //     message.event_id = message.event_id || crypto.randomUUID()

  //     // send event before setting timestamp since the backend peer doesn't expect this field
  //     dataChannel.send(JSON.stringify(message))

  //     // if guard just in case the timestamp exists by miracle
  //     if (!message.timestamp) {
  //       message.timestamp = timestamp
  //     }
  //     setEvents((prev) => [message, ...prev])
  //   } else {
  //     console.error(
  //       'Failed to send message - no data channel available',
  //       message,
  //     )
  //   }
  // }

  function pauseMic() {
    const track = mediaStreamRef.current?.getAudioTracks?.()[0]
    if (!track) {
      console.warn('No local audio track to pause')
      return
    }
    track.enabled = false
    setIsMicPaused(true)
  }

  function resumeMic() {
    const track = mediaStreamRef.current?.getAudioTracks?.()[0]
    if (!track) {
      console.warn('No local audio track to resume')
      return
    }
    track.enabled = true
    setIsMicPaused(false)
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener('message', (e) => {
        const event = JSON.parse(e.data) as RealtimeEvent
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString()
        }

        setEvents((prev) => [event, ...prev])

        console.log(event)

        if (
          event.type === 'conversation.item.input_audio_transcription.completed'
        ) {
          console.log(event.transcript)
          setSentences((prev) => prev + ' ' + event.transcript)

          //모든 문장이 transcription 되어야지 session을 종료할 수 있음
          if (event.item_id === lastestItemId.current) {
            setCanStopSession(true)
          }
        } else if (event.type === 'input_audio_buffer.speech_started') {
          lastestItemId.current = event.item_id
          setCanStopSession(false)
        }
      })

      // Set session active when the data channel is opened
      dataChannel.addEventListener('open', () => {
        setIsSessionActive(true)
        setEvents([])
      })
    }
  }, [dataChannel])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-24 min-h-0">
      <Card className="flex-1 flex flex-col h-full">
        <div className="mt-12 flex gap-12">
          <button
            type="button"
            onClick={pauseMic}
            disabled={!isSessionActive || isMicPaused}
            className="px-16 py-8 rounded-md border border-gray-300 disabled:opacity-50 hover:shadow-sm"
          >
            Mute Mic
          </button>
          <button
            type="button"
            onClick={resumeMic}
            disabled={!isSessionActive || !isMicPaused}
            className="px-16 py-8 rounded-md border border-gray-300 disabled:opacity-50 hover:shadow-sm"
          >
            Unmute Mic
          </button>
        </div>
        <div className="flex-1">{sentences}</div>
        <SessionControls
          startSession={startSession}
          stopSession={stopSession}
          isSessionActive={isSessionActive}
          canStopSession={canStopSession}
        />
      </Card>
      <Card className="flex flex-col h-full min-h-0">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EventLog events={events} />
        </div>
      </Card>
    </div>
  )
}
