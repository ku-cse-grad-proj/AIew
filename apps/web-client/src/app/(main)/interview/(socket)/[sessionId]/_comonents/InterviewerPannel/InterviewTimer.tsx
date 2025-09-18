'use client'
import Image from 'next/image'
export default function InterviewTimer() {
  return (
    <div className="px-10 py-6 inline-flex gap-4 rounded-[10px] bg-neutral-background">
      <Image
        src={'/icons/hourglass.svg'}
        alt={'hourglass image'}
        width={20}
        height={20}
      />
      <span className="font-medium">26 : 15</span>
    </div>
  )
}
