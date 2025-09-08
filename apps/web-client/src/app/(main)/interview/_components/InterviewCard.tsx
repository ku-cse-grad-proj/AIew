'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import EditDeleteButtons from './EditDeleteButtons'
import InterviewStatusChip from './InterviewStatusChip'

import { privateFetch } from '@/app/lib/fetch'

export default function InterviewCard({
  data,
  onDelete,
}: {
  data: Interview
  onDelete?: (id: string) => void
}) {
  const [interview, setInterview] = useState(data)

  // interview 상태가 PENDING이 아닐 때까지 상태를 polling
  useEffect(() => {
    if (interview.status !== 'PENDING') return

    const interval = setInterval(async () => {
      try {
        const res = await privateFetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/interviews/${interview.id}`,
          { cache: 'no-store' }, // 항상 fresh fetch
        )
        const updated = await res.json()
        setInterview(updated)

        if (updated.status !== 'PENDING') {
          clearInterval(interval) // READY or FAILED 되면 중단
        }
      } catch (err) {
        console.error('Failed to fetch interview:', err)
      }
    }, 2000) // 2초마다 polling

    return () => clearInterval(interval)
  }, [interview.id, interview.status])

  const handleDelete = (id?: string) => {
    if (!id) {
      console.error('id가 필요합니다')
      return
    }
    //Carousel에서 삭제
    onDelete?.(id)
  }

  const { id, title, company, jobTitle, jobSpec, createdAt, status } = interview

  return (
    <article className="relative min-w-50 min-h-280 p-24 rounded-[20px] bg-neutral-card flex flex-col justify-between shadow-box">
      <Link
        href={`/interview/waiting/${id}`}
        className="absolute inset-0 rounded-[20px] z-0"
      >
        <span className="sr-only">인터뷰 대기 화면으로 이동</span>
      </Link>

      <header className="w-full flex justify-between items-center">
        <InterviewStatusChip status={status} />
        <span className="text-neutral-subtext">
          {new Date(createdAt).toISOString().split('T')[0]}
        </span>
      </header>

      <h2 className="text-[28px] leading-[48px] font-semibold">{title}</h2>

      <dl>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            company name
          </dt>
          <dd className="leading-[24px]">{company}</dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            job
          </dt>
          <dd className="leading-[24px]">
            {jobTitle} &gt; {jobSpec}
          </dd>
        </div>
      </dl>

      <footer className="flex justify-between items-center h-40">
        <div className="flex gap-8 h-32">
          <EditDeleteButtons id={id} onDeleteClick={handleDelete} />
        </div>
        <Link
          className="bg-primary rounded-[10px] text-neutral-inverse px-20 h-40 flex items-center justify-center z-10"
          href={`/interview/waiting/${id}`}
        >
          start interview
        </Link>
      </footer>
    </article>
  )
}
