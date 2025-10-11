import MetricsPannel from './MetricsPannel'

export default function OverviewSection({ className }: { className?: string }) {
  const dtStyle = 'text-[14px] text-neutral-subtext'

  return (
    <section className={`w-full h-full flex flex-col py-16 px-24 ${className}`}>
      <header className="pb-24">
        <h2 className="text-[24px] font-bold leading-[36px]">
          interview report
        </h2>
      </header>
      <div className="flex-1 min-h-0 flex gap-24">
        <dl className="flex-1 h-full flex flex-col gap-8">
          <div>
            <dt className={dtStyle}>job</dt>
            <dd>web developer {'>'} frontend</dd>
          </div>
          <div>
            <dt className={dtStyle}>resume</dt>
            <dd>resume_digital.pdf</dd>
          </div>
          <div>
            <dt className={dtStyle}>portfolio</dt>
            <dd>portfolio.pdf</dd>
          </div>
          <div className="flex-1 min-h-0">
            <dt className={dtStyle}>인재상</dt>
            <dd className="text-[14px]">
              창의력과 열정, 고객을 위한 가치 창조 ,기업가정신, 전문지식
            </dd>
          </div>
        </dl>
        <MetricsPannel className="flex-1 min-w-0 h-full" />
      </div>
    </section>
  )
}
