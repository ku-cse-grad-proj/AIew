'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

import { QuestionItem, QuestionList } from '../_types'

export default function ListSection({
  className,
  questionList,
}: {
  className?: string
  questionList: QuestionList[]
}) {
  return (
    <section className={`w-full h-full ${className}`}>
      <ul className="w-full h-full p-16 overflow-auto">
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
