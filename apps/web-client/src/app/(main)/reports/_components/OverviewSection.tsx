import { InterviewInfo, OverviewInfo } from '../_types'

import MetricsPannel from './MetricsPannel'

export default function OverviewSection({
  className,
  overview,
}: {
  className?: string
  overview: OverviewInfo
}) {
  const dtStyle = 'text-[14px] text-neutral-subtext'

  const interview: InterviewInfo = overview.interviewInfo

  return (
    <section className={`w-full h-full flex flex-col py-16 px-24 ${className}`}>
      <header className="pb-24">
        <h2 className="text-[24px] font-bold leading-[36px]">
          {interview.title} report
        </h2>
      </header>
      <div className="flex-1 min-h-0 flex gap-24">
        <dl className="flex-1 h-full flex flex-col gap-8">
          <div>
            <dt className={dtStyle}>job</dt>
            <dd>
              {interview.jobTitle} {'>'} {interview.jobSpec}
            </dd>
          </div>
          <div>
            <dt className={dtStyle}>resume</dt>
            <dd>{interview.coverLetterFilename}</dd>
          </div>
          <div>
            <dt className={dtStyle}>portfolio</dt>
            <dd>{interview.portfolioFilename}</dd>
          </div>
          <div className="flex-1 min-h-0">
            <dt className={dtStyle}>인재상</dt>
            <dd className="text-[14px]">{interview.idealTalent}</dd>
          </div>
        </dl>
        <MetricsPannel
          className="flex-1 min-w-0 h-full"
          metricsInfo={overview.metricsInfo}
        />
      </div>
    </section>
  )
}
