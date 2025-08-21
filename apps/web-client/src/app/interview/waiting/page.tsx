import FooterButtons from '../_components/FooterButtons'

import InfoItem from './components/InfoItem'
import LoadingCircle from './components/LoadingCircle'

import Card from '@/app/interview/_components/Card'

export default function WaitingPage() {
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
      <Card className="w-full h-full flex flex-col items-center justify-center relative">
        <div className="flex-1 flex flex-col items-center justify-center gap-48">
          <div className="flex items-center justify-center">
            <LoadingCircle />
          </div>
          <span
            className="text-black shimmer-text"
            data-content="preparing interview..."
          >
            preparing interview...
          </span>
        </div>
        <FooterButtons isWaiting />
      </Card>
    </div>
  )
}
