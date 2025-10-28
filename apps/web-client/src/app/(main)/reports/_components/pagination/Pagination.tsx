'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import PaginationArrow from './PaginationArrow'
import PaginationItem from './PaginationItem'

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex gap-8">
      <PaginationArrow
        href={createPageURL(currentPage - 1)}
        direction={'left'}
        isDisabled={currentPage <= 1}
      />
      <div className="flex bg-neutral-card shadow-box rounded-[10px] p-2 gap-2">
        {generatePageList(currentPage, totalPages).map(
          (page: number | string, i) => (
            <PaginationItem
              key={i}
              page={page}
              href={createPageURL(page)}
              isCurrent={page === currentPage}
            />
          ),
        )}
      </div>
      <PaginationArrow
        href={createPageURL(currentPage + 1)}
        direction={'right'}
        isDisabled={currentPage >= totalPages}
      />
    </div>
  )
}

function generatePageList(currentPage: number, totalPages: number) {
  //9 이하면 그대로 출력
  // 1 2 3 4 5 6 7 8 9
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  //10 이상이면

  //currentPage가 5 이하일 때
  //1 2 3 4 5 6 7 ... totalPages
  if (currentPage <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, '...', totalPages]
  }

  //totalPages -5 이하일 때(totalPages가 15라 가정)
  //1 ... 9 10 11 12 13 14 15
  if (currentPage >= totalPages - 4) {
    const start = totalPages - 6
    return [1, '...', ...Array.from({ length: 7 }, (_, i) => start + i)]
  }

  //그 외
  //1 ... 10 11 12 13 14 ... 24
  const middle = Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
  return [1, '...', ...middle, '...', totalPages]
}
