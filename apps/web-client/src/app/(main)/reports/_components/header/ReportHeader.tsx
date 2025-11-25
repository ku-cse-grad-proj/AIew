import { Suspense } from 'react'

import { Query } from '../../_types'

import ReportCalendarButton from './ReportCalendarButton'
import ReportFilterButton from './ReportFilterButton'
import ReportInfos from './ReportInfos'
import ReportInfosSkeleton from './ReportInfosSkeleton'
import ReportSearchInput from './ReportSearchInput'
import ReportSearchSelect from './ReportSearchSelect'
import ToggleButton from './ToggleButton'

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
          <ToggleButton />
        </div>
      </div>
      <Suspense key={query.toString()} fallback={<ReportInfosSkeleton />}>
        <ReportInfos query={query} />
      </Suspense>
    </section>
  )
}
