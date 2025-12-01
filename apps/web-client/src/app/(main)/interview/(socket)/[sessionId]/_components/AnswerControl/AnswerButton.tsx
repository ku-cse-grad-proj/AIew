'use client'

import Image from 'next/image'

interface AnswerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isMicPaused: boolean
}

export default function AnswerButton({
  isMicPaused,
  ...props
}: AnswerButtonProps) {
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={isMicPaused ? '답변 시작' : '답변 제출'}
      // TODO:: 사용자 음성 크기에 따라 버튼 크기 달라지도록
      className={`w-48 h-48 p-8 rounded-full ${
        isMicPaused
          ? 'bg-primary'
          : 'bg-primary ring-4 ring-offset-4 ring-primary/40 animate-pulse'
      } ${props.className}`}
    >
      <Image src={'/icons/mic.svg'} alt={'mic icon'} width={32} height={32} />
    </button>
  )
}
