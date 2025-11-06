// _components/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
  return (
    <article
      className="w-full h-full flex flex-col min-h-0"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Title skeleton */}
      <div className="h-40 w-300 max-w-[60%] rounded-md bg-neutral-gray animate-pulse" />

      <div
        className="flex-1 w-full min-h-0 flex flex-col sm:grid sm:grid-cols-2
        sm:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)_minmax(300px,auto)]
        lg:grid-cols-3 lg:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)]
        gap-24 pt-24"
      >
        {/* 1) UserInfos, recent interview (col-span-2) */}
        <div className="col-span-2 h-full rounded-[10px] bg-neutral-card animate-pulse flex"></div>

        {/* 2) RecentReports (lg 회색 카드 느낌) */}
        <div className="h-full rounded-[10px] bg-neutral-gray animate-pulse p-16 flex flex-col gap-12 order-2 lg:order-none">
          <div className="h-6 w-36 rounded bg-neutral-card/60" />
          <div className="space-y-6">
            <div className="h-16 rounded bg-neutral-card/60" />
            <div className="h-16 rounded bg-neutral-card/60" />
          </div>
        </div>

        {/* 3) recent graph */}
        <div className="h-full rounded-[10px] bg-neutral-card animate-pulse p-16 flex flex-col gap-12">
          <div className="h-6 w-32 rounded bg-neutral-hover" />
          <div className="flex-1 rounded-[10px] bg-neutral-hover" />
        </div>

        {/* 4) company graph  */}
        <div className="lg:col-span-2 lg:row-start-2 row-start-3 col-span-2 h-full rounded-[10px] bg-neutral-card animate-pulse p-16 flex flex-col gap-12">
          <div className="h-6 w-32 rounded bg-neutral-hover" />
          <div className="flex-1 rounded-[10px] bg-neutral-hover" />
        </div>
      </div>
    </article>
  )
}
