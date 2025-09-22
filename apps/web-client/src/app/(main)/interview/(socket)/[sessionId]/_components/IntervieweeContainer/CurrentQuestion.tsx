import Image from 'next/image'
export default function CurrentQuestion({ onClick }: { onClick: () => void }) {
  return (
    <h3>
      <button
        type="button"
        className="w-full flex items-center justify-between p-8"
        onClick={onClick}
      >
        <span className="text-[20px] font-medium">Question 1</span>
        <Image
          src={'/icons/toggle_false.svg'}
          alt={'toggle icon'}
          width={20}
          height={20}
        />
      </button>
    </h3>
  )
}
