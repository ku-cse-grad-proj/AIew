import CardSection from './CardSection'
import styles from './dashboard.module.css'
import EmptyMessage from './EmptyMessage'
import ReportCard from './ReportCard'
import ShortcutLink from './ShortcutLink'

export type Report = {
  id: number
  title: string
  jobTitle: string
  jobSpec: string
  finishDate: string
}

export default function RecentReports({
  reports,
  className,
}: {
  reports: Report[]
  className?: string
}) {
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
