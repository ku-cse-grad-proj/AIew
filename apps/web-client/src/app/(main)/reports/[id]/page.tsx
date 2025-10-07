import DeckLayout from '../_components/DeckLayout'
import OverviewSection from '../_components/OverviewSection'

export default function ReportPage() {
  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <div className={`w-full h-full flex flex-col gap-24`}>
      <OverviewSection className={`flex-7 min-h-0 ${cardStyle}`} />
      <DeckLayout className={`flex-8 min-h-0`}>
        {/* top card */}
        <div>feedback</div>
        {/* bottom card */}
        <div>
          <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">graph</h2>
        </div>
      </DeckLayout>
    </div>
  )
}
