import { Suspense } from 'react'

import CardSection from './CardSection'
import styles from './dashboard.module.css'
import DoughnutGraph from './DoughnutGraph'

import { companyCount } from '@/app/lib/mockData'

export default async function CompanyGraph({
  className,
}: {
  className?: string
}) {
  return (
    <CardSection className={`p-16 h-full flex flex-col relative ${className}`}>
      <h3 className={`${styles.sectionHeading}`}>compnay graph</h3>

      <Suspense
        fallback={
          <div className="flex-1 min-h-250 w-full rounded-full bg-neutral-background animate-pulse mt-8" />
        }
      >
        <GraphArea />
      </Suspense>
    </CardSection>
  )
}

async function GraphArea() {
  const companyCount = await fetchGraphData()
  return (
    <div className="flex-1 min-h-250 w-full">
      <DoughnutGraph data={companyCount} />
    </div>
  )
}

async function fetchGraphData() {
  await new Promise((r) => setTimeout(r, 1000))
  return companyCount
}
