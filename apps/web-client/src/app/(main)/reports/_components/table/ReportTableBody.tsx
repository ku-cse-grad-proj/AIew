import Link from 'next/link'

import { Query } from '../../page'

import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default async function TableBody({ query }: { query: Query }) {
  const reports = await fetchCurrentPageReports(query)

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

async function fetchCurrentPageReports(query: Query) {
  const response = await fetch(
    `http://localhost:4000/mock-api/reports?${new URLSearchParams(query)}`,
  )
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return await response.json()
}
