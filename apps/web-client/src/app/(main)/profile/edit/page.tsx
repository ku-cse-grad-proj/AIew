import { Suspense } from 'react'

import EditProfileSection from './_components/EditProfileSection'

export default function EditProfilePage() {
  return (
    <div className="w-full flex-1 min-h-0 flex items-center justify-center">
      <Suspense>
        <EditProfileSection />
      </Suspense>
    </div>
  )
}
