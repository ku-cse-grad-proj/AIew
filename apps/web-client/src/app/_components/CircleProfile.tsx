import Image from 'next/image'

/**
 * CircleProfile
 * @component
 *
 * @param {Object} props
 * @param {string} props.src - 원본 이미지 URL (필수)
 * @param {string} [props.updatedAt] - 이미지가 갱신될 때마다 변경되는 timestamp 또는 version 문자열.
 *                                     캐시를 무효화하여 새 이미지를 강제로 렌더링하기 위한 값.
 * @param {string} [props.name] - 접근성 및 alt 텍스트용 사용자 이름
 * @param {number} [props.width] - 렌더링될 이미지 영역의 width(px)
 * @param {number} [props.height] - 렌더링될 이미지 영역의 height(px)
 * @param {string} [props.className] - 추가 스타일링을 위한 Tailwind CSS 클래스
 *
 * @returns 원형으로 클리핑된 최적화된 프로필 이미지 컴포넌트
 * @returns
 */
export default function CircleProfile({
  src,
  updatedAt,
  name,
  width,
  height,
  className,
}: {
  src: string
  updatedAt?: string
  name?: string
  width?: number
  height?: number
  className?: string
}) {
  const picUrl = updatedAt ? `${src}?v=${updatedAt}` : src
  return (
    <div
      className={`relative rounded-full aspect-square overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Image
        src={picUrl}
        alt={`${name ?? name} profile image`}
        fill
        sizes="120px"
        className="object-cover"
      />
    </div>
  )
}
