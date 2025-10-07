import { ReactNode } from 'react'

export default function DeckCard({
  className,
  children,
  showBottom,
  onClick,
  bottom,
}: {
  className?: string
  children?: ReactNode
  showBottom: boolean
  onClick: () => void
  bottom?: boolean
}) {
  const cardBasePosition = bottom ? 'bottom-0' : 'top-0'
  //hover시 감정 카드일 경우엔 아래로, 결과값은 위로
  const hoverTranslate = bottom
    ? 'hover:translate-y-10'
    : 'hover:-translate-y-10'
  const isActive = bottom ? showBottom : !showBottom
  //현재 보이는 카드가 메인일 때에는 그림자 및 z-10 추가,
  //아닐 경우는 뒤로 숨김
  const hoverState = isActive
    ? 'shadow-box z-10'
    : `scale-x-97 ${hoverTranslate} hover:duration-300 hover:ease-out`
  return (
    <div
      onClick={onClick}
      className={`absolute ${cardBasePosition} left-1/2 -translate-x-1/2 w-full h-[90%] bg-neutral-card rounded-[20px]
        transition-all duration-500 ease-in-out will-change-transform ${className} ${hoverState}`}
    >
      {children}
    </div>
  )
}
