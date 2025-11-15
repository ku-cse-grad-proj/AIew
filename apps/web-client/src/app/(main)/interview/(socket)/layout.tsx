import { ReactNode, Suspense } from 'react'

import InterviewSocket from './InterviewSocket'

export default function SocketLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense>
        <InterviewSocket />
      </Suspense>
      {children}
    </>
  )
}
