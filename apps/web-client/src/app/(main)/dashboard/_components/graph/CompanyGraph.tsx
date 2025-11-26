import { Suspense } from 'react'

import { getCompanyGraph } from '../../_lib/api'
import CardSection from '../CardSection'
import styles from '../dashboard.module.css'
import EmptyMessage from '../EmptyMessage'

import DoughnutGraph from '@/app/(main)/_components/graph/DoughnutGraph'

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
  const { labels, counts } = await getCompanyGraph()
  const companyCount = [labels, counts] as [string[], number[]]

  return (
    <div className="flex-1 min-h-250 w-full flex items-center justify-center">
      {labels.length ? (
        <DoughnutGraph data={companyCount} />
      ) : (
        <EmptyMessage
          main="Create one to start!"
          sub="No ongoing or ready interviews"
        />
      )}
    </div>
  )
}
