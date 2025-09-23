'use client'

import type { ReactNode } from 'react'

import Cancel from '@/../public/icons/cancel.svg'

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
  return <dd className="flex-1 text-[12px]">{children}</dd>
}

export default function HintPannel({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`w-full h-full p-24 shadow-box bg-white rounded-[20px] relative ${className}`}
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
          <Dd>TECHNICAL</Dd>
        </Entry>
        <Entry>
          <Dt>criteria</Dt>
          <Dd>성능 최적화, 접근성</Dd>
        </Entry>
        <Entry>
          <Dt>rationale</Dt>
          <Dd>
            사용자의 답변에서 구체적인 사례와 도구에 대한 설명이 부족하므로,
            이를 보완하기 위해 구체적인 예시를 요구합니다.
          </Dd>
        </Entry>
      </dl>
    </div>
  )
}
