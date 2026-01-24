'use client'

import Link from 'next/link'
import { useState } from 'react'

import EditDeleteButtons from './EditDeleteButtons'
import InterviewStatusChip from './InterviewStatusChip'

import { useInterviewPolling } from '@/app/hooks/useInterviewPolling'
import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

export default function InterviewCard({ data }: { data: Interview }) {
  const [interview, setInterview] = useState(data)

  useInterviewPolling(interview, setInterview)

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
          <EditDeleteButtons id={id} />
        </div>
        <ButtonLink href={`/interview/${id}`}>start interview</ButtonLink>
      </footer>
    </article>
  )
}
