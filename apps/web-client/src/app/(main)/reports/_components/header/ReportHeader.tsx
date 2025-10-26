import Link from 'next/link'

import ReportCalendarButton from './ReportCalendarButton'
import ReportFilterButton from './ReportFilterButton'
import ReportInfo from './ReportInfo'
import ReportSearchInput from './ReportSearchInput'
import ReportSearchSelect from './ReportSearchSelect'

import Graph from '@/../public/icons/graph.svg'

export default function ReportHeader() {
  const reportInfos = [
    { title: 'total reports count', description: '32' },
    { title: 'average score', description: '3.7' },
    { title: 'average duratoin', description: '48 min' },
    { title: 'total reports count', description: '32' },
  ]
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
      <dl className="w-full flex justify-between gap-16 pt-16">
        {reportInfos.map((info, i) => (
          <ReportInfo
            key={i}
            title={info.title}
            description={info.description}
          />
        ))}
      </dl>
    </section>
  )
}
