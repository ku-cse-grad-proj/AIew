import Image from 'next/image'

export default function RedoButton() {
  return (
    <button className="px-16 py-10 inline-flex gap-8 bg-neutral-background rounded-[10px]">
      <Image src={'/icons/redo.svg'} alt={'redo icon'} width={20} height={20} />
      <span className="text-neutral-subtext">Redo Answer</span>
    </button>
  )
}
