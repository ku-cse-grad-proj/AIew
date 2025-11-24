import Link from 'next/link'

import { getReports, Query } from '../../_lib/api'
import ReportOptionButton from '../ReportOptionButton'

import styles from './table.module.css'

import EmptyMessage from '@/app/(main)/dashboard/_components/EmptyMessage'

export default async function TableBody({ query }: { query: Query }) {
  const reports = await getReports(query)

  if (!reports || reports.length === 0) {
    return (
      <EmptyMessage
        main=" No result to display"
        sub="complete an interview to generate a report"
        showIcon
      />
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
            {/* 10개중 마지막 일때만 popover를 위로 위치시킨다. 
            아래로 할 경우 content가 layout에 잘리는 문제가 있음 */}
            <ReportOptionButton
              contentPosition={i == 9 ? 'top-right' : 'bottom-right'}
            />
          </div>
        ) : (
          <div key={i} className="w-full min-h-40 py-8"></div>
        ),
      )}
    </div>
  )
}
