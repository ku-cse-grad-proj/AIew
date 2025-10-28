import ReportHeader from './_components/header/ReportHeader'
import Pagination from './_components/pagination/Pagination'
import ReportTable from './_components/table/ReportTable'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>
type Query = [string, string][]

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  //URLSearchParmas의 생성자 type에 parmas 맞게 변환
  const query = Object.entries(params).filter(
    (_, value) => value != null,
  ) as Query
  const totalPages = await fetchReportsCount(query)

  return (
    <article className="w-full h-full flex flex-col items-center gap-24">
      <ReportHeader />
      <ReportTable />
      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </article>
  )
}

async function fetchReportsCount(query: Query): Promise<number> {
  const response = await fetch(
    `http://localhost:4000/mock-api/reports/pages/count?${new URLSearchParams(query)}`,
  )
  const data = await response.json()

  return data
}
