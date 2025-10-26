import ReportHeader from './_components/header/ReportHeader'
import ReportTable from './_components/ReportTable'

export default function ReportsPage() {
  return (
    <article className="w-full h-full flex flex-col items-center gap-24">
      <ReportHeader />
      <ReportTable />
      <div className="w-300 h-48 bg-neutral-card rounded-[20px] shadow-box">
        pagination
      </div>
    </article>
  )
}
