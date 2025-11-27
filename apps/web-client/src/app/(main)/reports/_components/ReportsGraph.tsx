import LineGraph from '../../_components/graph/LineGraph'
import EmptyMessage from '../../dashboard/_components/EmptyMessage'
import { GraphData } from '../_types'

export default function ReportsGraph({ data }: { data: GraphData }) {
  const { labels, scores, durations } = data
  const graphData = [labels, scores, durations] as [
    string[],
    number[],
    number[],
  ]
  const hasData = data && data.labels && data.labels.length > 0

  return (
    <div
      className={
        'w-full flex-1 min-h-0 bg-neutral-card shadow-box rounded-[20px] flex items-center justify-center'
      }
    >
      {hasData ? (
        <LineGraph data={graphData} />
      ) : (
        <EmptyMessage
          main=" No result to display"
          sub="complete an interview to generate a report"
          showIcon
        />
      )}
    </div>
  )
}
