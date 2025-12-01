'use client'

import { useRouter } from 'next/navigation'

import Warning from '@/../public/icons/warning.svg'

export default function GlobalError() {
  const router = useRouter()
  return (
    <html>
      <body className="w-full h-dvh flex flex-col justify-center items-center gap-16 bg-neutral-background p-16">
        <Warning width={48} height={48} />
        <h2 className="text-error">Something went wrong!</h2>
        <button
          className="px-16 py-8 bg-primary text-neutral-background rounded-[10px]"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </body>
    </html>
  )
}
