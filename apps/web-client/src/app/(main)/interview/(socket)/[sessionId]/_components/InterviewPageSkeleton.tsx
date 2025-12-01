export default function InterviewPageSkeleton() {
  return (
    <article className="w-full h-full grid grid-cols-[2fr_1fr] grid-rows-[7fr_1fr] gap-24">
      {/* Interviewer Panel Skeleton */}
      <div className="min-w-0 min-h-0 animate-pulse bg-neutral-card rounded-[20px] shadow-box p-24 flex flex-col gap-8">
        <div className="w-150 h-40 bg-neutral-200 animate-pulse rounded-xl" />
        <div className="flex-1 flex flex-col gap-24">
          <div className="w-full aspect-[16/9] bg-gray-500 rounded-[20px]" />
          <div className="flex-1 bg-neutral-background rounded-[20px]" />
        </div>
      </div>

      {/* Interviewee Container Skeleton */}
      <div className="min-w-0 min-h-0 col-start-2 row-start-1 row-end-3 animate-pulse bg-neutral-card rounded-[20px] shadow-box"></div>

      {/* Answer Control Skeleton */}
      <div className="min-w-0 min-h-0 animate-pulse bg-neutral-card rounded-[20px] shadow-box"></div>
    </article>
  )
}
