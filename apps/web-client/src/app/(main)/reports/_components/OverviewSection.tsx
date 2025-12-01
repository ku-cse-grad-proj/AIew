import { InterviewInfo, OverviewInfo } from '../_types'

import BackButton from './BackButton'
import MetricsPannel from './MetricsPannel'
import ReportOptionButton from './ReportOptionButton'

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
    <section
      className={`w-full flex-1 min-h-0 flex flex-col py-16 pr-24 overflow-auto ${className}`}
    >
      <header className="pb-24 flex pl-8 justify-between items-center">
        <div className="flex gap-4">
          <BackButton />
          <h2 className="text-[24px] font-bold leading-[36px]">
            {interview.title} report
          </h2>
        </div>
        <ReportOptionButton id={overview.id} />
      </header>
      <div className="flex-1 min-h-0 flex pl-36 gap-24">
        <dl className="flex-1 min-h-0 flex flex-col gap-8">
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
          className="flex-1 min-w-0 min-h-168"
          metricsInfo={overview.metricsInfo}
        />
      </div>
    </section>
  )
}
