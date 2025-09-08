import Card from '../../_components/Card'
import EditDeleteButtons from '../../_components/EditDeleteButtons'

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
    { cache: 'no-store' },
  )
  const interview: Interview = await response.json()
  return (
    <div className="w-full h-full flex flex-col lg:flex-row p-24 gap-24">
      <Card className="w-full h-full flex flex-col">
        <span className="text-right text-gray-500">
          {new Date(interview.createdAt)
            .toLocaleString('sv-SE')
            .replace('T', ' ')}
        </span>
        <h1 className="text-[32px] font-bold">{interview.title}</h1>
        <dl className="flex flex-col flex-1 pt-24 gap-24">
          <InfoItem label="Job" value={interview.jobTitle} />
          <InfoItem label="Detail Job" value={interview.jobSpec} />
          <InfoItem label="company name" value={interview.company} />
          <InfoItem
            label="인재상"
            value={interview.idealTalent}
            className="flex-auto"
          />
          <InfoItem label="resume" value={interview.coverLetterFilename} />
          <InfoItem label="portfolio" value={interview.portfolioFilename} />
        </dl>
        <div className="flex justify-end">
          <EditDeleteButtons id={sessionId} />
        </div>
      </Card>
      <LoadingCard sessionId={sessionId} />
    </div>
  )
}
