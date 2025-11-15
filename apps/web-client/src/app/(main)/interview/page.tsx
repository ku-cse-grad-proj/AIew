import Link from 'next/link'
import { Suspense } from 'react'

import Skeleton from './_components/CardsSkeleton'
import Carousel from './_components/Carousel'

import { privateFetch } from '@/app/lib/fetch'

export default async function InterviewPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-[40px] font-bold leading-[72px]">interview</h1>
        <Link
          className="text-neutral-inverse text-[20px] p-16 bg-secondary hover:bg-secondary-hover rounded-[20px] shadow-box"
          href={'/interview/create'}
        >
          create interview
        </Link>
      </div>
      <Suspense fallback={<Skeleton />}>
        <InterviewList />
      </Suspense>
    </div>
  )
}

async function InterviewList() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/interviews`,
  )
  const cards: Interview[] = await response.json()
  return <Carousel cards={cards} />
}
