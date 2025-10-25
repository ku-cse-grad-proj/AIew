import Link from 'next/link'

import ReportCalendarButton from './_components/header/ReportCalendarButton'
import ReportFilterButton from './_components/header/ReportFilterButton'
import ReportSearchInput from './_components/header/ReportSearchInput'
import ReportSelect from './_components/header/ReportSelect'

import Graph from '@/../public/icons/graph.svg'

export default function ReportsPage() {
  return (
    <article>
      <div className="flex justify-between">
        <div className="flex gap-8">
          <ReportSelect
            name="search_section"
            defaultValue={'title'}
            className="min-w-120"
          >
            <option value="title">title</option>
            <option value="company">company</option>
          </ReportSelect>
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
    </article>
  )
}
