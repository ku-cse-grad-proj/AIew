'use client'

import type { ReactNode } from 'react'

import Cancel from '@/../public/icons/cancel.svg'
import { useInterviewStore } from '@/app/lib/socket/interviewStore'

const Entry = ({ children }: { children: ReactNode }) => {
  return <div className="w-full flex">{children}</div>
}

const Dt = ({ children }: { children: ReactNode }) => {
  return (
    <dt className="w-64 text-[12px] font-medium text-neutral-subtext leading-[24px]">
      {children}
    </dt>
  )
}

const Dd = ({ children }: { children: ReactNode }) => {
  return (
    <dd className="flex-1 min-h-0 flex gap-4 text-[12px] leading-[12px]">
      {children}
    </dd>
  )
}

const Tag = ({ children }: { children: ReactNode }) => {
  return (
    <span className="p-8 bg-neutral-background rounded-[8px]">{children}</span>
  )
}

export default function HintPannel({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  const current = useInterviewStore((state) => state.current)

  return (
    <div
      className={`w-full h-full p-24 shadow-box bg-white rounded-[20px] relative overflow-y-auto ${className}`}
    >
      <button
        type="button"
        className="absolute top-24 right-24"
        onClick={onClick}
      >
        <Cancel width={20} height={20} />
      </button>
      <dl className="w-full h-full flex flex-col justify-between ">
        <Entry>
          <Dt>type</Dt>
          <Dd>
            <Tag>{current?.type}</Tag>
          </Dd>
        </Entry>
        <Entry>
          <Dt>criteria</Dt>
          <Dd>
            {current?.criteria.map((item, i) => (
              <Tag key={i}>{item}</Tag>
            ))}
          </Dd>
        </Entry>
        <Entry>
          <Dt>rationale</Dt>
          <Dd>
            <p className="leading-[18px]">{current?.rationale}</p>
          </Dd>
        </Entry>
      </dl>
    </div>
  )
}
