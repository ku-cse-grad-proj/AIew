export default function ReportInfo({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="bg-neutral-background px-24 py-4 rounded-[10px] flex-1 flex flex-col">
      <dt className="text-[14px] text-neutral-subtext leading-22">{title}</dt>
      <dd className="text-[20px] leading-30">{description}</dd>
    </div>
  )
}
