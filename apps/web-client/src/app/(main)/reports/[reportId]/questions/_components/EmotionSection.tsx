'use client'
import { useSearchParams } from 'next/navigation'

import { EmotionGraphDataWithId } from '../../../_types'

import EmotionGraph from '@/app/(main)/_components/graph/EmotionGraph'
import EmptyMessage from '@/app/(main)/dashboard/_components/EmptyMessage'

export default function EmotionSection({
  dataWithId,
}: {
  dataWithId: EmotionGraphDataWithId[]
}) {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const graphData =
    dataWithId.find((data) => data.id === id)?.graphData ??
    dataWithId[0].graphData

  return (
    <section className="w-full h-full px-8 pt-8 pb-32">
      {graphData ? (
        <EmotionGraph data={graphData} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <EmptyMessage
            main=" No emotional data to display"
            sub="complete an interview to generate a report"
            showIcon
          />
        </div>
      )}
      <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">
        emotional feedback
      </h2>
    </section>
  )
}
