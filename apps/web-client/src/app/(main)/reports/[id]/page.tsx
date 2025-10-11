import DeckLayout from '../_components/DeckLayout'
import Feedback from '../_components/Feedback'
import OverviewSection from '../_components/OverviewSection'

export default function ReportPage() {
  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <div className={`w-full h-full flex flex-col gap-24`}>
      <OverviewSection className={`flex-7 min-h-0 ${cardStyle}`} />
      <DeckLayout className={`flex-8 min-h-0`}>
        {/* top card */}
        <Feedback feedback={getFeedback()} />
        {/* bottom card */}
        <div>
          <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">graph</h2>
        </div>
      </DeckLayout>
    </div>
  )
}

function getFeedback() {
  return `지원자의 답변은 질문과 전혀 관련이 없으며, React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 설명이 전혀 포함되어 있지 않습니다. 
  이는 지원자가 해당 기술에 대한 이해가 부족하거나 질문을 제대로 이해하지 못했음을 나타냅니다. 
  React와 Zustand를 사용하여 리스트 렌더링 속도를 개선하는 방법에는 예를 들어, React.memo를 사용하여 불필요한 렌더링을 방지하거나, Zustand의 상태 관리 최적화를 통해 성능을 향상시키는 방법 등이 있습니다. 
  지원자는 이러한 구체적인 방법을 설명함으로써 자신의 기술적 역량을 보여줄 필요가 있습니다. 또한, 답변의 내용이 질문과 관련이 없다는 점에서 면접 질문에 대한 이해도와 준비가 부족하다는 인상을 줄 수 있습니다. 
  이러한 점을 개선하기 위해서는 관련 기술에 대한 깊이 있는 이해와 준비가 필요합니다.
  지원자의 답변은 질문과 전혀 관련이 없으며, React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 설명이 전혀 포함되어 있지 않습니다. 
  이는 지원자가 해당 기술에 대한 이해가 부족하거나 질문을 제대로 이해하지 못했음을 나타냅니다. 
  React와 Zustand를 사용하여 리스트 렌더링 속도를 개선하는 방법에는 예를 들어, React.memo를 사용하여 불필요한 렌더링을 방지하거나, Zustand의 상태 관리 최적화를 통해 성능을 향상시키는 방법 등이 있습니다. 
  지원자는 이러한 구체적인 방법을 설명함으로써 자신의 기술적 역량을 보여줄 필요가 있습니다. 또한, 답변의 내용이 질문과 관련이 없다는 점에서 면접 질문에 대한 이해도와 준비가 부족하다는 인상을 줄 수 있습니다. 
  이러한 점을 개선하기 위해서는 관련 기술에 대한 깊이 있는 이해와 준비가 필요합니다.
  지원자의 답변은 질문과 전혀 관련이 없으며, React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 설명이 전혀 포함되어 있지 않습니다. 
  이는 지원자가 해당 기술에 대한 이해가 부족하거나 질문을 제대로 이해하지 못했음을 나타냅니다. `
}
