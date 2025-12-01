import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import Triangle from '@/../public/icons/arrow_triangle.svg'

type Label = 'title' | 'company' | 'job' | 'date' | 'score' | 'duration'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: Label
  children?: ReactNode
}

export default function HeaderSortButton({ label, ...props }: ButtonProps) {
  const { replace } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  const preSort = params.get('sort')
  const [key, order] = preSort?.split('-') ?? []

  const handleClick = () => {
    //기존 정렬되어 있는 곳을 클릭했을 때, desc였으면 asc로, asc였으면 null로 설정
    const nextOrder = key === label ? (order === 'asc' ? null : 'asc') : 'desc'

    if (nextOrder) {
      params.set('sort', `${label}-${nextOrder}`)
    } else {
      params.delete('sort')
    }

    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <button
      type="button"
      {...props}
      className={`flex justify-start items-center`}
      onClick={handleClick}
    >
      {label}
      {key === label && order && (
        <Triangle
          width={20}
          height={20}
          className={order === 'asc' ? 'rotate-180' : ''}
        />
      )}
    </button>
  )
}
