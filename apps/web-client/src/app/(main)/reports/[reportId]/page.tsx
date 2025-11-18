import DeckLayout from '../_components/DeckLayout'
import Feedback from '../_components/Feedback'
import OverviewSection from '../_components/OverviewSection'
import { getReport } from '../_lib/api'
import { ReportResponse } from '../_types'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params

  const reportData: ReportResponse = await getReport(reportId)

  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'

  return (
    <div className={`w-full h-full flex flex-col gap-24`}>
      <OverviewSection
        className={`flex-7 min-h-0 ${cardStyle}`}
        overview={reportData.overviewInfo}
      />
      <DeckLayout className={`flex-8 min-h-0`}>
        {/* top card */}
        <Feedback feedback={reportData.feedback} />
        {/* bottom card */}
        <div>
          <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">graph</h2>
        </div>
      </DeckLayout>
    </div>
  )
}
