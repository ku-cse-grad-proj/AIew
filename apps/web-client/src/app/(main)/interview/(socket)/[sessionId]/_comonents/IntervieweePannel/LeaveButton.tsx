import Image from 'next/image'
export default function LeaveButton() {
  return (
    <button className="w-full flex items-center justify-center gap-10 py-12 outline outline-1 outline-neutral-subtext rounded-[10px]">
      <Image src={'/icons/exit.svg'} alt={'exit icon'} width={20} height={20} />
      <span className="font-medium text-neutral-subtext leading-[24px]">
        Leave Interview
      </span>
    </button>
  )
}
