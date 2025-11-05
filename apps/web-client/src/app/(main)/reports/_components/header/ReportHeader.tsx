import Link from 'next/link'
import { Suspense } from 'react'

import { Query } from '../../page'

import ReportCalendarButton from './ReportCalendarButton'
import ReportFilterButton from './ReportFilterButton'
import ReportInfo from './ReportInfo'
import ReportInfosSkeleton from './ReportInfosSkeleton'
import ReportSearchInput from './ReportSearchInput'
import ReportSearchSelect from './ReportSearchSelect'

import Graph from '@/../public/icons/graph.svg'

export default function ReportHeader({ query }: { query: Query }) {
  return (
    <section className="w-full bg-neutral-card rounded-[20px] p-24 shadow-box">
      <h2 className="sr-only">reports header</h2>
      <div className="flex justify-between">
        <div className="flex gap-8">
          <ReportSearchSelect />
          <ReportSearchInput />
        </div>
        <div className="flex gap-8">
          <ReportCalendarButton />
          <ReportFilterButton />
          <Link
            href={'/reports'}
            className="bg-primary inline-flex items-center px-16 rounded-[10px] h-40 gap-8"
          >
            <Graph width={20} height={20} />
            <span className="text-neutral-background">show graph</span>
          </Link>
        </div>
      </div>
      <Suspense key={query.toString()} fallback={<ReportInfosSkeleton />}>
        <ReportInfos query={query} />
      </Suspense>
    </section>
  )
}

async function ReportInfos({ query }: { query: Query }) {
  const data = await fetchReportsSummary(query)
  const reportInfos = [
    { title: 'total reports count', description: data.totalReports },
    { title: 'average score', description: data.averageScore },
    { title: 'average duration', description: `${data.averageDuration} min` },
    {
      title: 'most frequent company',
      description: data.mostFrequentCompany,
    },
  ]
  return (
    <dl className="w-full flex justify-between gap-16 pt-16">
      {reportInfos.map((info, i) => (
        <ReportInfo key={i} title={info.title} description={info.description} />
      ))}
    </dl>
  )
}

async function fetchReportsSummary(query: Query) {
  const response = await fetch(
    `http://localhost:4000/mock-api/reports/summary?${new URLSearchParams(query)}`,
  )
  return response.json()
}
