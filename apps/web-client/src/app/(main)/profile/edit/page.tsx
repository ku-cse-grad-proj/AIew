import { Suspense } from 'react'

import EditProfileSection from './_components/EditProfileSection'

export default function EditProfilePage() {
  return (
    <Suspense>
      <EditProfileSection />
    </Suspense>
  )
}
