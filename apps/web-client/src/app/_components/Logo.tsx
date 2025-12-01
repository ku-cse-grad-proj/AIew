import Link from 'next/link'

/**
 * 로고 컴포넌트
 *
 * 지정된 경로로 이동하는 링크 형태의 로고를 렌더링합니다.
 * `href` 값을 전달하지 않으면 기본적으로 루트 경로(`/`)로 이동합니다.
 *
 * @param {string | undefined} [props.href] - 로고 클릭 시 이동할 경로(선택값)
 * @param {string | undefined} [props.className] - 컴포넌트의 class 값(선택값)
 *
 * @returns Logo component
 *
 */
export default function Logo({
  href,
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link href={href ?? '/'} className={`${className}`}>
      <span className="text-primary text-4xl font-bold">AIew</span>
    </Link>
  )
}
