import DeckLayout from '../_components/DeckLayout'
import Feedback from '../_components/Feedback'
import OverviewSection from '../_components/OverviewSection'
import { ReportResponse } from '../_types'

import { privateFetch } from '@/app/lib/fetch'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { CORE_API_URL, API_PREFIX } = process.env
  const { reportId } = await params
  const res = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/${reportId}`,
  )

  const reportData: ReportResponse = await res.json()

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
