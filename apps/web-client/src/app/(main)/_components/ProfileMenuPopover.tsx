import Link from 'next/link'

import { getUser } from '../_lib/api'

import SignOutButton from './SignOutButton'

import CircleProfile from '@/app/_components/CircleProfile'

export default async function ProfileMenuPopover() {
  const me = await getUser()

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-24">
      <div className="flex flex-col gap-16 pt-16">
        <CircleProfile
          src={me.pic_url}
          updatedAt={me.updatedAt}
          name={me.name}
          width={72}
          height={72}
        />
        <p className="text-[20px] font-bold">hi, {me.name}</p>
      </div>
      <div className="w-full flex flex-col gap-16">
        <Link
          className="border border-neutral-subtext w-full py-8 rounded-[10px] inline-flex items-center justify-center"
          href={'/profile/edit'}
        >
          <span>edit profile</span>
        </Link>
        <SignOutButton />
      </div>
    </div>
  )
}
