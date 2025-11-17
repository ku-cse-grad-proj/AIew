export default function Loading() {
  const cardStyle = 'w-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <div className={`w-full h-full flex flex-col gap-24`}>
      <div className={`flex-7 min-h-0 flex flex-col gap-24 p-24 ${cardStyle}`}>
        {/* title */}
        <div className="h-36 w-2/5 bg-gray-200 animate-pulse rounded-full" />
        <div className="flex-1 w-full flex gap-24">
          {/* OverviewSection */}
          <dl className="flex-1 h-full flex flex-col gap-16">
            {/* questions */}
            <div className="flex-1 min-h-0">
              <dt className="h-14 w-52 bg-gray-200 rounded-full" />
              <dd className="mt-4 space-y-6">
                <div className="h-12 w-full bg-gray-200 rounded-full" />
                <div className="h-12 w-full bg-gray-200 rounded-full" />
                <div className="h-12 w-180 bg-gray-200 rounded-full" />
              </dd>
            </div>
            {/* evaluation criteria */}
            <div className="flex-1 min-h-0">
              <dt className="h-14 w-52 bg-gray-200 rounded-full" />
              <dd className="mt-4 space-y-6">
                <div className="h-12 w-full bg-gray-200 rounded-full" />
                <div className="h-12 w-[90%] bg-gray-200 rounded-full" />
                <div className="h-12 w-180 bg-gray-200 rounded-full" />
              </dd>
            </div>
            {/* answer */}
            <div className="flex-1 min-h-0">
              <dt className="h-14 w-52 bg-gray-200 rounded-full" />
              <dd className="mt-4 space-y-6">
                <div className="h-12 w-full bg-gray-200 rounded-full" />
                <div className="h-12 w-200 bg-gray-200 rounded-full" />
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className={`flex-8 min-h-0 relative`}>
        {/* top card */}
        <div className={`absolute w-full h-[90%] z-10 ${cardStyle}`}>
          <h2 className="pl-16 pt-10 font-medium">feedback</h2>
        </div>
        {/* bottom card */}
        <div
          className={`absolute top-0 w-full h-full scale-x-97 bg-neutral-card rounded-[20px]`}
        >
          <h2 className="absolute bottom-0 pl-16 pb-10 font-medium">
            emotional feedback
          </h2>
        </div>
      </div>
    </div>
  )
}
