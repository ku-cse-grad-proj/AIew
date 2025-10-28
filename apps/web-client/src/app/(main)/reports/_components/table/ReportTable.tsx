import Link from 'next/link'

import { Query } from '../../page'

import TableHeader from './ReportTableHeader'
import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default async function ReportTable({ query }: { query: Query }) {
  const reports = await fetchCurrentPageReports(query)
  return (
    <section className={`${styles.table}`}>
      <TableHeader />
      <div className="flex-1 w-full min-h-0 flex flex-col justify-around px-8 overflow-y-auto">
        {Array.from({ length: 10 }, (_, i) => reports[i] || {}).map(
          (item, i) =>
            item.id ? (
              <div
                key={i}
                className="w-full flex items-center px-8 rounded-[10px] hover:bg-gray-200"
              >
                <Link
                  className={`${styles.row} py-8`}
                  href={`/reports/${item.id}`}
                >
                  <div>{item.title}</div>
                  <div>{item.company}</div>
                  <div>{item.job}</div>
                  <div>{item.date}</div>
                  <div>{item.score}</div>
                  <div>{item.duration}</div>
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
    </section>
  )
}

async function fetchCurrentPageReports(query: Query) {
  const response = await fetch(
    `http://localhost:4000/mock-api/reports?${new URLSearchParams(query)}`,
  )
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return await response.json()
}
