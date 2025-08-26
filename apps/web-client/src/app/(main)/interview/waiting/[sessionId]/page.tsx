import Card from '../../_components/Card'

import InfoItem from './components/InfoItem'
import LoadingCard from './components/LoadingCard'

export default async function WaitingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  console.log('WaitingPage sessionId:', sessionId)
  return (
    <div className="w-full h-full flex items-center justify-center p-24 gap-24">
      <Card className="w-full h-full flex flex-col">
        <h1 className="text-[24px] font-bold text-black">Interview Summary</h1>
        <dl className="flex flex-col flex-1 pt-24 gap-24">
          <InfoItem label="select Job" value="Web Developer" />
          <InfoItem label="select Detail Job" value="Frontend" />
          <InfoItem label="company name" value="건국대학교" />
          <InfoItem label="인재상" value="성신의" className="flex-auto" />
          <InfoItem label="resume" value="resume_digital.pdf" />
          <InfoItem label="portfolio" value="portfolio_digita.pdf" />
        </dl>
      </Card>
      <LoadingCard sessionId={sessionId} />
    </div>
  )
}
