import styles from './dashboard.module.css'

export default function InfoCard({
  title,
  description,
  className,
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={`h-full min-h-96 p-10 lg:p-16 ${styles.card} ${className}`}>
      <dl className="w-full h-full relative">
        <dt className="font-medium">{title}</dt>
        <dd className="absolute top-1/2 -translate-y-1/2 text-[32px] font-bold">
          {description}
        </dd>
      </dl>
    </div>
  )
}
