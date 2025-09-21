import Image from 'next/image'
export default function Questions() {
  return (
    <header className="w-full flex items-center justify-between p-8">
      <h3 className="text-[20px] font-medium">Questions 1</h3>
      <Image
        src={'/icons/toggle_false.svg'}
        alt={'toggle icon'}
        width={20}
        height={20}
      />
    </header>
  )
}
