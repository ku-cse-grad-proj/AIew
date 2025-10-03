'use client'

import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

import { QuestionItem, QuestionList } from '../_types'

import CancelIcon from '@/../public/icons/cancel.svg'

export default function ListSection({
  className,
  questionList,
}: {
  className?: string
  questionList: QuestionList[]
}) {
  const params = useParams()
  const reportId = params.id
  return (
    <section className={`w-full h-full flex flex-col ${className}`}>
      <div className="pt-16 pr-16 pb-8 flex justify-end">
        {/* TODO:: tooltip 추가하기 */}
        <Link
          href={`/reports/${reportId}`}
          className="inline-flex p-8 bg-neutral-background rounded-[16px]"
        >
          <CancelIcon width={24} height={24} />
        </Link>
      </div>
      <ul className="w-full flex-1 min-h-0 px-16 pb-16  overflow-auto">
        {questionList.map((main: QuestionList, i) => (
          <li key={main.id} className="pl-8 py-8">
            <ItemLink questionItem={main} isDefault={i === 0}>
              Q{i + 1}. {main.question}
            </ItemLink>
            <ul>
              {main.followUps.map((follow: QuestionItem, j) => (
                <li key={follow.id} className="pl-16 py-4">
                  <ItemLink questionItem={follow}>
                    Q{i + 1}-{j + 1}. {follow.question}
                  </ItemLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ItemLink({
  questionItem,
  children,
  isDefault,
}: {
  questionItem: QuestionItem
  children: ReactNode
  isDefault?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const id = searchParams.get('id')
  const isActive = questionItem.id === id || (isDefault && !id)
  return (
    <Link
      href={pathname + '?id=' + questionItem.id}
      className={`block text-[14px] ${isActive ? 'font-medium' : 'text-neutral-subtext'}`}
    >
      {children}
    </Link>
  )
}
