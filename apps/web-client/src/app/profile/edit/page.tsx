import { SearchParams } from 'next/dist/server/request/search-params'

import EditProfileSection from './_components/EditProfileSection'

import Logo from '@/app/_components/Logo'

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const from = params['from']
  const href = from ? '/' + from : '/dashboard'

  return (
    <div className="w-full min-h-dvh min-h-500 flex flex-col gap-24 justify-center items-center ">
      <div className="w-full max-w-1248 flex-1 min-h-500 flex flex-col p-24 gap-24 overflow-auto">
        <Logo href={href} />
        <div className="flex-1 min-h-0 flex flex-col justify-center">
          <div className="max-h-452 flex justify-center">
            <EditProfileSection />
          </div>
        </div>
      </div>
    </div>
  )
}
