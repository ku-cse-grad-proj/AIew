import { Suspense } from 'react'

import Modal from '../../_components/Modal'

import EditProfileSection from '@/app/profile/edit/_components/EditProfileSection'

export default function ProfileEditPage() {
  return (
    <Modal>
      <Suspense>
        <EditProfileSection isModal />
      </Suspense>
    </Modal>
  )
}
