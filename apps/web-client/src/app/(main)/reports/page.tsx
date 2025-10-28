import ReportHeader from './_components/header/ReportHeader'
import Pagination from './_components/pagination/Pagination'
import ReportTable from './_components/ReportTable'

export default async function ReportsPage() {
  // const totalPages = await fetchReportPages(query)
  const totalPages = 49
  return (
    <article className="w-full h-full flex flex-col items-center gap-24">
      <ReportHeader />
      <ReportTable />
      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </article>
  )
}
