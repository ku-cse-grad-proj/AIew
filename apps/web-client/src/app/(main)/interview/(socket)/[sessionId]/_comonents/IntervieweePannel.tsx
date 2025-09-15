'use client'

import EventLog from '../../../stt/[sessionId]/_components/EventLog'

import { useSttStore } from '@/app/lib/socket/sttStore'

export default function IntervieweePannel() {
  const sentences = useSttStore((state) => state.sentences)
  const evnets = useSttStore((state) => state.events)
  return (
    <div className="overflow-auto">
      <p>{sentences}</p>
      <EventLog events={evnets} />
    </div>
  )
}
