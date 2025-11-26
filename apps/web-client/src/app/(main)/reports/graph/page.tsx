import ReportHeader from '../_components/header/ReportHeader'
import ReportsGraph from '../_components/ReportsGraph'
import { getReportsGraph } from '../_lib/api'
import { getQueryWithoutPage } from '../_lib/utils'
import { SearchParams } from '../_types'

export default async function ReportGraphPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const queryWithoutPage = getQueryWithoutPage(params)
  const graphData = await getReportsGraph(queryWithoutPage)

  return (
    <article className="w-full flex-1 min-h-0 flex flex-col gap-24">
      <ReportHeader query={queryWithoutPage} />
      <ReportsGraph data={graphData} />
    </article>
  )
}
