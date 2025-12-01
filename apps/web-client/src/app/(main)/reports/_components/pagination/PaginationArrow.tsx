import Link from 'next/link'

import LeftArrow from '@/../public/icons/arrow_back.svg'
import RightArrow from '@/../public/icons/arrow_forward.svg'

export default function PaginationArrow({
  href,
  direction,
  isDisabled,
}: {
  href: string
  direction: 'left' | 'right'
  isDisabled?: boolean
}) {
  const icon =
    direction === 'left' ? (
      <LeftArrow width={20} height={20} />
    ) : (
      <RightArrow width={20} height={20} />
    )

  const buttonView =
    'w-36 h-36 bg-neutral-card rounded-[10px] flex items-center justify-center shadow-box'
  return isDisabled ? (
    <div className={`${buttonView} opacity-40`}>{icon}</div>
  ) : (
    <Link href={href} className={`${buttonView} hover:bg-gray-300`}>
      {icon}
    </Link>
  )
}
