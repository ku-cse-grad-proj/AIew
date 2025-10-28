import Link from 'next/link'

import TableHeader from './ReportTableHeader'
import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'
import { reportsData } from '@/app/lib/mockData'

export default function ReportTable() {
  const data = reportsData.slice(0, 10)
  return (
    <section className="w-full min-h-24 flex-1 flex flex-col bg-neutral-card rounded-[20px] shadow-box">
      <TableHeader />
      <div className="flex-1 w-full min-h-0 flex flex-col justify-around px-8 overflow-y-auto">
        {Array.from({ length: 10 }, (_, i) => data[i] || {}).map((item, i) =>
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
