'use client'

import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'

import Modal from './Modal'

import useInterviewFinish from '@/app/hooks/useInterviewFinish'

export default function InterviewFinishModal({
  sessionId,
  status,
}: {
  sessionId: string
  status: string
}) {
  const { finished, reportReady, remainingSeconds } =
    useInterviewFinish(sessionId)

  //완료된 인터뷰에 접근시 뒤로 돌아가게 유도
  if (status === 'COMPLETED' && !finished && !reportReady) {
    return (
      <Modal>
        <ErrorPage reason="완료한 Interview는 진행할 수 없습니다" />
      </Modal>
    )
  }

  //인터뷰 진행 중이라면 모달 안 보이게 설정
  if (!finished) return null

  return (
    <Modal>
      <div className="flex flex-col gap-24 items-center text-[20px] font-semibold">
        {reportReady ? (
          <div className="flex flex-col gap-8 items-center">
            <p>Your report is ready.</p>
            <p>Redirecting in {remainingSeconds ?? 3}s</p>
          </div>
        ) : (
          <>
            <LoaderCircle className={`w-32 h-32 animate-spin text-secondary`} />
            <span>Preparing your report...</span>
          </>
        )}
        <Link href={'/dashboard'} className="text-neutral-subtext text-[14px]">
          Back to dashboard
        </Link>
      </div>
    </Modal>
  )
}

function ErrorPage({ reason }: { reason: string }) {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-24">
      {reason}
      <Link
        href={'/interview'}
        className="px-16 py-10 bg-primary text-neutral-background rounded-[10px]"
      >
        back to Interview
      </Link>
    </div>
  )
}
