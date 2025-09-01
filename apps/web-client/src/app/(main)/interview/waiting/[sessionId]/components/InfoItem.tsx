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
    <div className={`${className}`}>
      <dt className="text-neutral-subtext text-[16px] leading-[24px]">
        {label}
      </dt>
      <dd className="text-[24px] leading-[36px]">{value}</dd>
    </div>
  )
}
