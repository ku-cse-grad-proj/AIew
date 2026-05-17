import { ReactNode } from 'react'

/**
 * (socket) 라우트 그룹 layout.
 *
 * Phase 2.3 — 옛 `<InterviewSocket />` (zustand store connect) 를 제거.
 * Socket 연결은 면접 화면(`[sessionId]/page.tsx`) 의 머신 (socketActor) 이
 * 보유하고, waiting 화면은 interview.status 를 polling 한다.
 */
export default function SocketLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
