import Link from 'next/link'

import ReportCalendarButton from './_components/header/ReportCalendarButton'
import ReportFilterButton from './_components/header/ReportFilterButton'
import ReportInfo from './_components/header/ReportInfo'
import ReportSearchInput from './_components/header/ReportSearchInput'
import ReportSelect from './_components/header/ReportSelect'

import Graph from '@/../public/icons/graph.svg'

export default function ReportsPage() {
  const reportInfos = [
    { title: 'total reports count', description: '32' },
    { title: 'average score', description: '3.7' },
    { title: 'average duratoin', description: '48 min' },
    { title: 'total reports count', description: '32' },
  ]
  return (
    <article>
      <div className="w-full bg-neutral-card rounded-[20px] p-24 shadow-box">
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
        <dl className="w-full flex justify-between gap-16 pt-16">
          {reportInfos.map((info, i) => (
            <ReportInfo
              key={i}
              title={info.title}
              description={info.description}
            />
          ))}
        </dl>
      </div>
    </article>
  )
}
