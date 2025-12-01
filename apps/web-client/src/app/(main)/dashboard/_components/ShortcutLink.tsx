import Link from 'next/link'

import Shortcut from '@/../public/icons/arrows_more.svg'

/**
 * dashboard에서 사용되는 바로가기 버튼
 * 원형 바탕에 >> icon이 그려져있는 모형이다.
 *
 * @component
 * @example
 * ```tsx
 * <ShortcutLink href="/interview/create" className="bg-primary text-white" />
 * ```
 *
 * @param {object} props
 * @param {string} props.href - 바로가기 링크 url
 * @param {string} [props.className] - Optional additional Tailwind CSS classes.
 *
 * @returns {JSX.Element} A circular link button with an arrow icon.
 */

export default function ShortcutLink({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`w-40 h-40 flex items-center justify-center rounded-full ${className}`}
    >
      <Shortcut width={24} height={24} />
    </Link>
  )
}
