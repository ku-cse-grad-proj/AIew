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
      <dt className="text-black text-[16px] leading-[24px]">{label}</dt>
      <dd className="text-black text-[24px] leading-[32px]">{value}</dd>
    </div>
  )
}
