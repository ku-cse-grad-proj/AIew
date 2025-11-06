import Link from 'next/link'

import { Report } from './RecentReports'

import Arrow from '@/../public/icons/toggle_false.svg'

export default function ReportCard({
  report,
  className,
}: {
  report: Report
  className?: string
}) {
  const { id, title, jobTitle, jobSpec, finishDate } = report
  return (
    <Link
      href={`/reports/${id}`}
      className={`py-10 pl-16 pr-8 bg-neutral-card rounded-[10px] flex ${className}`}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-4">
        <h4 className="text-[20px] font-medium">{title}</h4>
        <dl className="flex flex-col">
          <SimpleDefinition
            title="job"
            description={`${jobTitle} > ${jobSpec}`}
          />
          <SimpleDefinition title="date" description={finishDate} />
        </dl>
      </div>
      <div className="flex justify-center items-center shrink-0">
        <Arrow width={24} height={24} />
      </div>
    </Link>
  )
}

function SimpleDefinition({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex text-neutral-subtext">
      <dt className="flex-1">{title}</dt>
      <dl className="flex-3">{description}</dl>
    </div>
  )
}
