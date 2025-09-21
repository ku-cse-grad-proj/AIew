import Image from 'next/image'
export default function HintSection({ className }: { className?: string }) {
  return (
    <button
      className={`w-full flex items-start justify-between px-8 py-4 ${className}`}
    >
      <div className="inline-flex items-center gap-4">
        <Image
          src={'/icons/lightbulb.svg'}
          alt={'lightbulb icon'}
          width={20}
          height={20}
        />
        <span className="text-[14px] font-medium leading-[24px]">
          Evalution Hint
        </span>
      </div>
      <Image
        src={'/icons/toggle_false.svg'}
        alt={'toggle icon'}
        width={20}
        height={20}
      />
    </button>
  )
}
