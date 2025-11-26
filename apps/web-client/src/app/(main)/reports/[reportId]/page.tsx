import DeckLayout from '../_components/DeckLayout'
import Feedback from '../_components/Feedback'
import OverviewSection from '../_components/OverviewSection'
import ReportGraph from '../_components/ReportGraph'
import { getReport } from '../_lib/api'
import { ReportResponse } from '../_types'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params

  const reportData: ReportResponse = await getReport(reportId)

  const cardStyle =
    'w-full flex-1 min-h-0 bg-neutral-card rounded-[20px] shadow-box'

  return (
    <div className={`w-full flex-1 min-h-0 flex flex-col gap-24`}>
      <OverviewSection
        className={`flex-7 min-h-0 ${cardStyle}`}
        overview={{ ...reportData.overviewInfo, id: reportId }}
      />
      <DeckLayout className={`flex-8 min-h-0`}>
        {/* top card */}
        <Feedback feedback={reportData.feedback} />
        {/* bottom card */}
        <ReportGraph data={reportData.graphData} />
      </DeckLayout>
    </div>
  )
}
