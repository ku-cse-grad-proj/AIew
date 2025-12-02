import Image from 'next/image'
export default function Interviewer({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full aspect-[16/9] bg-gray-500 rounded-[20px] relative overflow-hidden ${className}`}
    >
      <Image src={'/interviewer.png'} alt={'interviewer'} fill sizes="720px" />
      {children}
    </div>
  )
}
