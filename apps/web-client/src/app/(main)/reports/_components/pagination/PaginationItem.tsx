import Link from 'next/link'

export default function PaginationItem({
  page,
  href,
  isCurrent,
}: {
  page: number | string
  href: string
  isCurrent?: boolean
}) {
  const pageView = 'w-32 h-32 rounded-[10px] flex items-center justify-center'
  return page === '...' ? (
    <span className={`${pageView}`}>...</span>
  ) : (
    <Link
      className={`${pageView} ${isCurrent ? 'bg-neutral-gray font-medium ' : 'text-neutral-subtext hover:bg-gray-200'}`}
      href={href}
    >
      <span>{page}</span>
    </Link>
  )
}
