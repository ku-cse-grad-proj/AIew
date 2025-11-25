export default function InfoItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`flex-1 min-h-0 flex flex-col ${className}`}>
      <dt className="text-neutral-subtext text-[16px] leading-[24px]">
        {label}
      </dt>
      <div className="flex-1 min-h-0 overflow-auto">
        <dd className="text-[24px] leading-[36px]">{value}</dd>
      </div>
    </div>
  )
}
