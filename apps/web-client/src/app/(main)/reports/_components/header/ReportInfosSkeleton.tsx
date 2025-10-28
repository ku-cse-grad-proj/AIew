export default function ReportInfosSkeleton() {
  return (
    <dl className="w-full flex justify-between gap-16 pt-16">
      {[
        'total reports count',
        'average score',
        'average duration',
        'most frequent company',
      ].map((title, i) => (
        <div
          key={i}
          className="bg-neutral-background px-24 py-4 rounded-[10px] flex-1 flex flex-col"
        >
          <dt className="text-[14px] text-neutral-subtext leading-22">
            {title}
          </dt>
          <div className="h-30 w-30 animate-bounce">.</div>
        </div>
      ))}
    </dl>
  )
}
