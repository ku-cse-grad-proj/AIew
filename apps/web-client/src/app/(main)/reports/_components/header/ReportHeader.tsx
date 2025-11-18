import Link from 'next/link'
import { Suspense } from 'react'

import { Query } from '../../_lib/api'

import ReportCalendarButton from './ReportCalendarButton'
import ReportFilterButton from './ReportFilterButton'
import ReportInfos from './ReportInfos'
import ReportInfosSkeleton from './ReportInfosSkeleton'
import ReportSearchInput from './ReportSearchInput'
import ReportSearchSelect from './ReportSearchSelect'

import Graph from '@/../public/icons/graph.svg'

export default async function ReportHeader({ query }: { query: Query }) {
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
