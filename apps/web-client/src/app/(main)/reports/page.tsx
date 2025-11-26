import { Suspense } from 'react'

import ReportHeader from './_components/header/ReportHeader'
import Pagination from './_components/pagination/Pagination'
import ReportTable from './_components/table/ReportTable'
import TableBody from './_components/table/ReportTableBody'
import TableBodySkeleton from './_components/table/ReportTableBodySkeleton'
import TableHeader from './_components/table/ReportTableHeader'
import { getTotalPage } from './_lib/api'
import { getQuery, getQueryWithoutPage } from './_lib/utils'
import { Query, SearchParams } from './_types'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const query: Query = getQuery(params)
  const queryWithoutPage = getQueryWithoutPage(params)

  const totalPages = await getTotalPage(query)

  return (
    <article className="w-full flex-1 min-h-0 flex flex-col items-center gap-24">
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
