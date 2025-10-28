import Link from 'next/link'

import TableHeader from './ReportTableHeader'
import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default function ReportTable() {
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

const data = [
  {
    id: 1,
    title: '배달의 민족 interview',
    company: '배달의 민족',
    job: 'web developer > frontend',
    date: '2025-10-22',
    score: 3.4,
    duration: '52 min',
  },
  {
    id: 2,
    title: '토스 interview',
    company: '비바리퍼블리카',
    job: 'web developer > frontend',
    date: '2025-10-21',
    score: 4.1,
    duration: '45 min',
  },
  {
    id: 3,
    title: '카카오 interview',
    company: '카카오',
    job: 'frontend engineer',
    date: '2025-10-20',
    score: 3.7,
    duration: '50 min',
  },
  {
    id: 4,
    title: '네이버 interview',
    company: '네이버',
    job: 'frontend engineer',
    date: '2025-10-18',
    score: 3.8,
    duration: '47 min',
  },
  {
    id: 5,
    title: '라인 interview',
    company: 'LINE Plus',
    job: 'frontend engineer',
    date: '2025-10-17',
    score: 4.3,
    duration: '49 min',
  },
  {
    id: 6,
    title: '쿠팡 interview',
    company: '쿠팡',
    job: 'web developer > frontend',
    date: '2025-10-15',
    score: 3.9,
    duration: '55 min',
  },
  {
    id: 7,
    title: '배민 상회 interview',
    company: '우아한형제들',
    job: 'web developer > backend',
    date: '2025-10-14',
    score: 3.2,
    duration: '58 min',
  },
  // {
  //   id: 8,
  //   title: '카카오엔터 interview',
  //   company: '카카오엔터테인먼트',
  //   job: 'web developer > frontend',
  //   date: '2025-10-13',
  //   score: 4.0,
  //   duration: '53 min',
  // },
  // {
  //   id: 9,
  //   title: '삼성 SDS interview',
  //   company: '삼성 SDS',
  //   job: 'web developer > fullstack',
  //   date: '2025-10-12',
  //   score: 3.6,
  //   duration: '46 min',
  // },
  // {
  //   id: 10,
  //   title: 'LG CNS interview',
  //   company: 'LG CNS',
  //   job: 'web developer > frontend',
  //   date: '2025-10-11',
  //   score: 4.2,
  //   duration: '54 min',
  // },
]
