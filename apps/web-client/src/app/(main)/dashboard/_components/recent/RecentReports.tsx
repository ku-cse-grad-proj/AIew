import { getDashboard } from '../../_lib/api'
import CardSection from '../CardSection'
import styles from '../dashboard.module.css'
import EmptyMessage from '../EmptyMessage'
import ShortcutLink from '../ShortcutLink'

import ReportCard from './ReportCard'

export type Report = {
  id: number
  title: string
  jobTitle: string
  jobSpec: string
  finishDate: string
}

export default async function RecentReports({
  className,
}: {
  className?: string
}) {
  const { reports }: { reports: Report[] } = await getDashboard()
  return (
    <CardSection
      className={`p-16 flex flex-col gap-16 bg-neutral-gray min-h-300 overflow-y-auto relative ${className}`}
    >
      <h3 className={`${styles.sectionHeading}`}>recent reports</h3>
      <ShortcutLink
        href="/reports"
        className="bg-neutral-card absolute right-12 top-12"
      />
      {reports && reports.length > 0 ? (
        <div className="flex-1 min-h-200 flex flex-col gap-16">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} className="flex-1" />
          ))}
        </div>
      ) : (
        <EmptyMessage
          main="No reports yet"
          sub="Finish an interview to create one"
        />
      )}
    </CardSection>
  )
}
