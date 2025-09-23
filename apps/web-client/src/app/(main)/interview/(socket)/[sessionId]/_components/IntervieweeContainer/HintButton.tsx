import Lightbulb from '@/../public/icons/lightbulb.svg'

export default function HintButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick}>
      <span className="inline-flex items-center gap-4 px-16 py-8 text-[14px] font-medium leading-[24px] bg-neutral-background rounded-[10px]">
        <Lightbulb width={20} height={20} />
        Evalution Hint
      </span>
    </button>
  )
}
