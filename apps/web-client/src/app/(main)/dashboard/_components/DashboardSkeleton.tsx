import CardSection from './CardSection'
import styles from './dashboard.module.css'

export function DashboardSkeleton() {
  return (
    <>
      {/* user infos */}
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 items-stretch gap-24">
        <div
          className={`h-full col-span-2 bg-neutral-card flex ${styles.card}`}
        ></div>
        <div
          className={`h-full min-h-96 p-10 lg:p-16 bg-neutral-gray ${styles.card}`}
        ></div>
        <div
          className={`h-full min-h-96 p-10 lg:p-16 bg-secondary ${styles.card}`}
        ></div>
      </div>

      {/* interview */}
      <CardSection className="p-16 h-full">{''}</CardSection>
      {/* reports */}
      <CardSection className="p-16 h-full bg-neutral-gray order-2 lg:order-none">
        {''}
      </CardSection>
    </>
  )
}
