'use client'
import { useState } from 'react'
import Button from './Button'

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false)

  function handleStartSession() {
    if (isActivating) return

    setIsActivating(true)
    startSession()
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={isActivating ? 'bg-gray-600' : 'bg-red-600'}
      >
        {isActivating ? 'starting session...' : 'start session'}
      </Button>
    </div>
  )
}

function SessionActive({ stopSession, canStopSession }) {
  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <Button disabled={!canStopSession} onClick={stopSession}>
        disconnect
      </Button>
    </div>
  )
}

export default function SessionControls({
  startSession,
  stopSession,
  isSessionActive,
  canStopSession,
}) {
  return (
    <div className="flex">
      {isSessionActive ? (
        <SessionActive
          canStopSession={canStopSession}
          stopSession={stopSession}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  )
}
