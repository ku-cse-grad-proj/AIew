import { Suspense } from 'react'

import { getLineGraph } from '../../_lib/api'
import CardSection from '../CardSection'
import styles from '../dashboard.module.css'
import ShortcutLink from '../ShortcutLink'

import LineGraph from './LineGraph'

export default async function RecentGraph({
  className,
}: {
  className?: string
}) {
  return (
    <CardSection className={`p-16 h-full flex flex-col relative ${className}`}>
      <h3 className={`${styles.sectionHeading}`}>recent graph</h3>
      <ShortcutLink
        href="/reports"
        className="bg-neutral-gray absolute right-12 top-12"
      />

      <Suspense
        fallback={
          <div className="flex-1 min-h-250 w-full rounded-[10px] bg-neutral-background animate-pulse mt-8" />
        }
      >
        <GraphArea />
      </Suspense>
    </CardSection>
  )
}

async function GraphArea() {
  const { labels, scores, durations } = await getLineGraph()

  const graphData = [labels, scores, durations] as [
    string[],
    number[],
    number[],
  ]

  return (
    <div className="flex-1 min-h-250 w-full">
      <LineGraph data={graphData} />
    </div>
  )
}
