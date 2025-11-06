import Link from 'next/link'

import InterviewStatusChip from '../../interview/_components/InterviewStatusChip'

export default function InterviewCard({ interview }: { interview: Interview }) {
  const { status, title, company, jobTitle, jobSpec } = interview
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
        <Link
          className="bg-primary rounded-[10px] text-neutral-inverse px-20 h-40 inline-flex items-center justify-center z-10"
          href={`/interview/${'30'}`}
        >
          start interview
        </Link>
      </div>
    </div>
  )
}
