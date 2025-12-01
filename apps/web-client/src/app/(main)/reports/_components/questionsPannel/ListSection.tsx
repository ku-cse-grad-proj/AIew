'use client'

import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

import { QuestionItem, QuestionList } from '../../[reportId]/questions/_types'

import CancelIcon from '@/../public/icons/cancel.svg'
import InfoIcon from '@/../public/icons/info.svg'

export default function ListSection({
  className,
  questionList,
}: {
  className?: string
  questionList: QuestionList[]
}) {
  const params = useParams()
  const reportId = params.reportId

  const searchParams = useSearchParams()
  const questionId = searchParams.get('id')
  const isReport = questionId == null

  return (
    <section className={`w-full flex-1 min-h-0 flex flex-col ${className}`}>
      <div className="w-full min-h-64 pt-16 px-16 flex items-center justify-between relative">
        {isReport ? (
          <>
            <h2 className="text-[20px] font-medium">Questions</h2>
            <InfoIcon width={24} height={24} />
          </>
        ) : (
          <Link
            href={`/reports/${reportId}`}
            className="inline-flex p-8 bg-neutral-background rounded-[16px] absolute right-16"
            replace
          >
            <CancelIcon width={24} height={24} />
          </Link>
        )}
      </div>
      <div className="w-full flex-1 min-h-0 relative">
        <ul className="absolute inset-0 w-full h-full px-16 overflow-auto">
          {questionList.map((main: QuestionList, i) => (
            <li key={main.id} className="pl-8 py-8">
              <ItemLink questionItem={main}>
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
      </div>
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
  const questionPathname = pathname.includes('questions')
    ? pathname
    : pathname + '/questions'
  return (
    <Link
      href={questionPathname + '?id=' + questionItem.id}
      className={`block text-[14px] transition-all duration-300 ease-in-out hover:scale-[1.03] ${isActive ? 'font-medium scale-[1.03]' : 'text-neutral-subtext'}`}
      replace
    >
      {children}
    </Link>
  )
}
