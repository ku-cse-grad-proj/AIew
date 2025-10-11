/**
 * MetricDetailContent 컴포넌트는 메트릭의 상세 정보를 표시하는 역할을 합니다.
 * children에는 일반적으로 DetailDLItem 또는 DetailDLQuestions 컴포넌트가 전달됩니다.
 */

import { ReactNode } from 'react'

export default function MetricDetail({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[20px] text-medium">{title}</h3>
      <dl className="flex-1 min-h-0 flex flex-col gap-2 pt-8 overflow-auto">
        {children}
      </dl>
    </div>
  )
}

export function DetailDLItem({
  title,
  content,
}: {
  title: string
  content: string
}) {
  return (
    <div className="flex-1 flex flex-col">
      <dt className="">{title}</dt>
      <dd className="flex-1 min-h-0 text-[20px]">{content}</dd>
    </div>
  )
}

export function DetailDLQuestions({
  list,
  suffix,
  unit,
}: {
  list: number[]
  suffix?: string
  unit?: string
}) {
  return (
    <>
      {list.map((item, i) => (
        <div key={i} className="flex justify-between">
          <dt className="text-neutral-subtext">{`question ${i + 1} ${suffix ? suffix : ''}`}</dt>
          <dd className="font-medium">
            {item} {unit}
          </dd>
        </div>
      ))}
    </>
  )
}
