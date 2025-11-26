import LineGraph from '../../_components/graph/LineGraph'
import { graphData } from '../_types'

export default function ReportGraph({
  className,
  data,
}: {
  className?: string
  data: graphData
}) {
  const { labels, scores, durations } = data
  const graphData = [labels, scores, durations] as [
    string[],
    number[],
    number[],
  ]
  return (
    <section className={`w-full h-full px-8 pt-8 pb-32 ${className}`}>
      <LineGraph data={graphData} />
      <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">graph</h2>
    </section>
  )
}
