import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-24">
      해당하는 report를 찾을 수 없습니다.
      <Link
        href={'/reports'}
        className="px-16 py-10 bg-primary text-neutral-background rounded-[10px]"
      >
        back to Reports
      </Link>
    </div>
  )
}
