import { ReactNode } from 'react'

import InterviewSocket from './InterviewSocket'

export default function SocketLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <InterviewSocket />
      {children}
    </>
  )
}
