'use client'

import { useRouter } from 'next/navigation'

import Warning from '@/../public/icons/warning.svg'

export default function Error() {
  const router = useRouter()
  return (
    <section className="w-full flex-1 min-h-0 flex flex-col justify-center items-center gap-16 bg-neutral-background rounded-[10px] p-16">
      <Warning width={48} height={48} />
      <h2 className="text-error text-[18px] font-medium">
        Something went wrong!
      </h2>
      <button
        className="px-16 py-8 bg-primary text-neutral-background rounded-[10px]"
        onClick={() => router.back()}
      >
        Go Back
      </button>
    </section>
  )
}
