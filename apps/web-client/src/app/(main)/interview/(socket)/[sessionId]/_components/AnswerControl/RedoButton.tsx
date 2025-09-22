'use client'

import Redo from '@/../public/icons/redo.svg'

export default function RedoButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      className="px-16 py-10 inline-flex items-center gap-8 bg-neutral-background rounded-[10px]"
      onClick={onClick}
    >
      <Redo width={20} height={20} />
      <span className="text-neutral-subtext">Redo Answer</span>
    </button>
  )
}
