import Link from 'next/link'

import { Query } from '../../page'

import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'
import Warning from '@/../public/icons/warning.svg'
import { privateFetch } from '@/app/lib/fetch'

export default async function TableBody({ query }: { query: Query }) {
  const { CORE_API_URL, API_PREFIX } = process.env

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/?${new URLSearchParams(query)}`,
    { cache: 'no-store' },
  )
  const reports = await response.json()

  if (!reports || reports.length === 0) {
    return (
      // TODO:: dashboard pr merge하면 EmptyMessage 컴포넌트로 교체
      <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-8">
        <Warning width={48} height={48} />
        <p className="text-[20px] font-medium text-shadow-xs">
          No result to display
        </p>
        <p className="text-[16px] text-neutral-subtext ">
          complete an interview to generate a report
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full min-h-0 flex flex-col justify-around px-8 overflow-y-auto">
      {Array.from({ length: 10 }, (_, i) => reports[i] || {}).map((item, i) =>
        item.id ? (
          <div
            key={i}
            className="w-full flex items-center px-8 rounded-[10px] hover:bg-gray-200"
          >
            <Link className={`${styles.row} py-8`} href={`/reports/${item.id}`}>
              <div>{item.title}</div>
              <div>{item.company}</div>
              <div>
                {item.jobTitle} {'>'} {item.jobSpec}
              </div>
              <div>{item.date}</div>
              <div>{item.score}</div>
              <div>{item.duration} min</div>
            </Link>
            <button>
              <Dots width={20} height={20} />
            </button>
          </div>
        ) : (
          <div key={i} className="w-full min-h-40 py-8"></div>
        ),
      )}
    </div>
  )
}
