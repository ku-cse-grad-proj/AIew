import Card from '@/app/(main)/interview/_components/Card'

export default function CardSkeleton() {
  return (
    <Card className="w-full h-full flex flex-col gap-24">
      {/* 상단 제목 + 날짜 영역 */}
      <div className="w-full h-72 flex justify-between relative">
        <div className="absolute right-0 h-24 w-1/4 bg-gray-200 rounded-md animate-pulse" />
        <div className="absolute bottom-0 w-1/2 h-40 bg-gray-200 rounded-md animate-pulse" />
      </div>

      {/* 본문 정보 영역 */}
      <dl className="flex flex-col flex-1 gap-24">
        <div className="h-60">
          <dt className="text-neutral-subtext ">Job</dt>
          <dd className="mt-4 h-6 w-24 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="h-60">
          <dt className="text-neutral-subtext ">Detail Job</dt>
          <dd className="mt-4 h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="h-60">
          <dt className="text-neutral-subtext ">company name</dt>
          <dd className="mt-4 h-6 w-40 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="flex-1">
          <dt className="text-neutral-subtext ">인재상</dt>
          <dd className="mt-4 h-24 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="h-60">
          <dt className="text-neutral-subtext ">resume</dt>
          <dd className="mt-4 h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="h-60">
          <dt className="text-neutral-subtext">portfolio</dt>
          <dd className="mt-4 h-6 w-56 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </dl>

      {/* 하단 버튼 영역 */}
      <div className="mt-24 flex justify-end gap-12">
        <div className="h-9 w-16 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </Card>
  )
}
