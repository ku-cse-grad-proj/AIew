import { Suspense } from 'react'

import { DashboardSkeleton } from './_components/DashboardSkeleton'
import CompanyGraph from './_components/graph/CompanyGraph'
import RecentGraph from './_components/graph/RecentGraph'
import Heading, { HeaderSkeleton } from './_components/Header'
import RecentInterview from './_components/recent/RecentInterview'
import RecentReports from './_components/recent/RecentReports'
import UserInfos from './_components/UserInfos'

import { privateFetch } from '@/app/lib/fetch'
import { CACHE_TAG } from '@/constants/cacheTags'

export async function fetchDashboardData() {
  const { CORE_API_URL, API_PREFIX } = process.env
  const res = await privateFetch(`${CORE_API_URL}/${API_PREFIX}/dashboard`, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAG.INTERVIEWS, CACHE_TAG.REPORTS, CACHE_TAG.USER] },
  })

  const data = await res.json()
  return data
}

export default function Dashboard() {
  return (
    <article className="w-full h-full flex flex-col min-h-0">
      <Suspense fallback={<HeaderSkeleton />}>
        <Heading />
      </Suspense>
      <div
        className="flex-1 w-full min-h-0 flex flex-col sm:grid sm:grid-cols-2 
       sm:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)_minmax(300px,auto)] 
       lg:grid-cols-3 lg:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)]
       gap-24 pt-24"
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <UserInfos />
          <RecentInterview />
          <RecentReports className="bg-neutral-gray order-2 lg:order-none" />
        </Suspense>
        <RecentGraph className="lg:col-span-2 lg:row-start-2 row-start-3 col-span-2" />
        <CompanyGraph className="order-1 lg:order-none" />
      </div>
    </article>
  )
}
