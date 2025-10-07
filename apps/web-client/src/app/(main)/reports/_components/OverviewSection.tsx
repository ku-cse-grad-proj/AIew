export default function OverviewSection({ className }: { className?: string }) {
  const dtStyle = 'text-[14px] text-neutral-subtext'
  const cardStyle =
    'w-full h-full rounded-[10px] bg-neutral-background transition-transform transition-shadow duration-300 ease-in-out hover:shadow-box hover:scale-[1.03]'
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
        <div className="flex-1 h-full grid grid-rows-2 grid-cols-2 gap-24">
          <button className={cardStyle}>score</button>
          <button className={cardStyle}>duration</button>
          <button className={cardStyle}>date</button>
          <button className={cardStyle}>question count</button>
        </div>
      </div>
    </section>
  )
}
