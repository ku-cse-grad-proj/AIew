import InterviewStatusChip from '@/app/(main)/interview/_components/InterviewStatusChip'
import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

export default function InterviewCard({ interview }: { interview: Interview }) {
  const { id, status, title, company, jobTitle, jobSpec } = interview
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between bg-neutral-background rounded-[10px] p-16">
      <InterviewStatusChip status={status} />
      <h2 className="text-[20px] leading-[48px] font-semibold">{title}</h2>
      <dl>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            company name
          </dt>
          <dd className="leading-[24px]">{company}</dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            job
          </dt>
          <dd className="leading-[24px]">
            {jobTitle} &gt; {jobSpec}
          </dd>
        </div>
      </dl>
      <div className="flex justify-end">
        <ButtonLink href={`/interview/${id}`}>start interview</ButtonLink>
      </div>
    </div>
  )
}
