import ReportHeader from './_components/header/ReportHeader'

export default function ReportsPage() {
  return (
    <article className="w-full h-full flex flex-col items-center gap-24">
      <ReportHeader />
      <section className="w-full flex-1 min-h-0 bg-neutral-card rounded-[20px] shadow-box"></section>
      <div className="w-300 h-48 bg-neutral-card rounded-[20px] shadow-box">
        pagination
      </div>
    </article>
  )
}
