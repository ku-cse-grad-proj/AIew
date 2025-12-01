import { updateProfile } from '../_lib/action'

import ProfileForm from './ProfileForm'

import { getUser } from '@/app/(main)/_lib/api'

export default async function EditProfileSection() {
  const me = await getUser()

  return (
    <section className="w-full h-full p-24 bg-neutral-card rounded-[20px]">
      <h2 className="text-[24px] font-medium pb-24">edit profile</h2>
      <ProfileForm key={me.updatedAt} user={me} action={updateProfile} />
    </section>
  )
}
