export default function QuestionsPanelSkeleton() {
  return (
    <div className="w-full h-full p-16 bg-neutral-card rounded-[20px] shadow-box overflow-hidden ">
      <div className="h-64"></div>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="space-y-8 pb-10">
          {/* 메인 질문 */}
          <div className="space-y-4">
            <div className="h-14 w-full rounded-full bg-neutral-200 animate-pulse" />
            <div className="h-14 w-4/6 rounded-full bg-neutral-200 animate-pulse" />
          </div>

          {/* 꼬리 질문 */}
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-4 pl-16">
                <div className="h-14 w-full rounded-full bg-neutral-200 animate-pulse" />
                <div className="h-14 w-3/4 rounded-full bg-neutral-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
