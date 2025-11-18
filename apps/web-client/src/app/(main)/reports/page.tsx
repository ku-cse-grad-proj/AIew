import { Suspense } from 'react'

import ReportHeader from './_components/header/ReportHeader'
import Pagination from './_components/pagination/Pagination'
import ReportTable from './_components/table/ReportTable'
import TableBody from './_components/table/ReportTableBody'
import TableBodySkeleton from './_components/table/ReportTableBodySkeleton'
import TableHeader from './_components/table/ReportTableHeader'
import { getTotalPage, Query } from './_lib/api'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

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

  const queryWithoutPage = query.filter(([key]) => key !== 'page')

  const totalPages = await getTotalPage(query)

  return (
    <article className="w-full h-full flex flex-col items-center gap-24">
      <ReportHeader query={queryWithoutPage} />

      <ReportTable>
        <TableHeader />
        <Suspense key={query.toString()} fallback={<TableBodySkeleton />}>
          <TableBody query={query} />
        </Suspense>
      </ReportTable>

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </article>
  )
}
