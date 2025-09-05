import Card from '../../_components/Card'
import { Interview } from '../../_components/InterviewCard'

import InfoItem from './components/InfoItem'
import LoadingCard from './components/LoadingCard'

import { privateFetch } from '@/app/lib/fetch'

export default async function WaitingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const response = await privateFetch(
    process.env.NEXT_PUBLIC_API_BASE + '/interviews/' + sessionId,
  )
  const interview: Interview = await response.json()
  console.log('WaitingPage sessionId:', sessionId)
  return (
    <div className="w-full h-full flex flex-col lg:flex-row p-24 gap-24">
      {/* TODO:: title, 인재상, resume, portfolio 제목 받아오기 */}
      <Card className="w-full h-full flex flex-col">
        <span className="text-right text-gray-500">
          {new Date(interview.createdAt)
            .toLocaleString('sv-SE')
            .replace('T', ' ')}
        </span>
        <h1 className="text-[32px] font-bold">{'title'}</h1>
        <dl className="flex flex-col flex-1 pt-24 gap-24">
          <InfoItem label="Job" value={interview.jobTitle} />
          <InfoItem label="Detail Job" value={interview.jobSpec} />
          <InfoItem label="company name" value={interview.company} />
          <InfoItem label="인재상" value={'성신의'} className="flex-auto" />
          <InfoItem label="resume" value="resume_digital.pdf" />
          <InfoItem label="portfolio" value="portfolio_digita.pdf" />
        </dl>
      </Card>
      <LoadingCard sessionId={sessionId} />
    </div>
  )
}
