import InfoItem from './InfoItem'

import Card from '@/app/(main)/interview/_components/Card'
import EditDeleteButtons from '@/app/(main)/interview/_components/EditDeleteButtons'
import { getInterview } from '@/app/(main)/interview/_lib/api'

export default async function InterviewInfo({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const interview: Interview = await getInterview(sessionId)

  return (
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
  )
}
