import { getDashboard } from '../_lib/api'

export default async function Heading() {
  const { userInfos } = await getDashboard()
  return (
    <>
      <h1 className="text-[32px] font-bold leading-[48px]">
        {userInfos.name}'s Dashboard
      </h1>
    </>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="h-48 w-200 bg-neutral-gray animate-pulse rounded-full" />
  )
}
