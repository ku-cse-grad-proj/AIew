import Link from 'next/link'

export default function ReportPage() {
  return (
    <div className="flex justify-between">
      report page 입니다
      <Link
        href={'/reports/1234/questions'}
        className="p-16 bg-primary text-neutral-background rounded-[20px]"
      >
        answer review 보러 가기
      </Link>
    </div>
  )
}
