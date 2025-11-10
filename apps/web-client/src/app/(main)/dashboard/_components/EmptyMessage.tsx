/**
 * 비어 있는 상태(Empty State)에서 안내문을 표시하는 컴포넌트입니다.
 *
 * @component
 * @example
 * ```tsx
 * <EmptyMessage
 *   main="No reports yet"
 *   sub="Finish an interview to create one"
 * />
 * ```
 *
 * @param {object} props - 컴포넌트에 전달되는 속성값
 * @param {string} props.main - 메인 안내 문구 (주요 메시지)
 * @param {string} props.sub - 서브 안내 문구 (보조 설명)
 * @returns {JSX.Element} 화면 중앙에 정렬된 안내문 컴포넌트
 */

import Warning from '@/../public/icons/warning.svg'

export default function EmptyMessage({
  main,
  sub,
  showIcon,
}: {
  main: string
  sub: string
  showIcon?: boolean
}) {
  return (
    <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-8">
      {showIcon && <Warning width={48} height={48} />}
      <p className="text-[20px] font-medium text-shadow-xs">{main}</p>
      <p className="text-[16px] text-neutral-subtext ">{sub}</p>
    </div>
  )
}
