import Image from 'next/image'

import { getUser } from '../_lib/api'

import SignOutButton from './SignOutButton'

export default async function ProfileMenuPopover() {
  const me = await getUser()

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-24">
      <div className="flex flex-col gap-16 pt-16">
        <Image
          className="rounded-full"
          src={me.pic_url}
          alt="profile img"
          width={72}
          height={72}
        />
        <p className="text-[20px] font-bold">hi, {me.name}</p>
      </div>
      <div className="w-full flex flex-col gap-16">
        <button className="border border-neutral-subtext w-full py-8 rounded-[10px]">
          <span>edit profile</span>
        </button>
        <SignOutButton />
      </div>
    </div>
  )
}
