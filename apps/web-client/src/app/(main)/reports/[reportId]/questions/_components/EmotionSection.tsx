// EmotionGraph.tsx 옆 혹은 근처 파일에 두고 써도 됨
import EmotionGraph, {
  EmotionGraphData,
} from '@/app/(main)/_components/graph/EmotionGraph'

export default function EmotionSection({
  emotionGraphData,
}: {
  emotionGraphData: EmotionGraphData
}) {
  return (
    <section className="w-full h-full px-8 pt-8 pb-32">
      <EmotionGraph data={emotionGraphData} />
      <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">
        emotional feedback
      </h2>
    </section>
  )
}
