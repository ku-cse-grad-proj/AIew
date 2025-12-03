'use client'

import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { UpdateProfileAction } from '../_lib/action'

import { UserResponse } from '@/app/(main)/_types'
import CircleProfile from '@/app/_components/CircleProfile'
import useProfileForm from '@/app/hooks/useProfileForm'
import { useProfileUpdatingStore } from '@/app/lib/useProfileUpdatingStore'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

export default function ProfileForm({
  user,
  action,
  isModal = false,
}: {
  user: UserResponse
  action: UpdateProfileAction
  isModal?: boolean
}) {
  const router = useRouter()
  const isUpdating = useProfileUpdatingStore((state) => state.isUpdating)
  const [picUrl, setPicUrl] = useState<string | null>(null)
  const src = picUrl ?? `${user.pic_url}?v=${user.updatedAt}`
  const { formAction, isPending } = useProfileForm(action)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('jpg, png, webp, gif 형식의 이미지를 선택해주세요.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('이미지 크기는 3MB를 초과할 수 없습니다.')
      e.target.value = ''
      return
    }
    const newUrl = URL.createObjectURL(file)
    setPicUrl(newUrl)
  }

  return (
    <>
      {isUpdating && <LoadingPopover />}
      <form
        action={formAction}
        className="w-full flex-1 min-h-320 flex flex-col items-center justify-between gap-48"
        aria-busy={isUpdating}
      >
        <div
          className={`w-full flex-1 min-h-0 flex flex-col items-center gap-24 ${!isModal ? 'lg:flex-row' : ''}`}
        >
          {/* profile */}
          <div className="w-full min-w-240 flex flex-col gap-24 items-center justify-center pt-24">
            <label className="group hover:cursor-pointer rounded-full relative hover:bg-blue-200">
              <CircleProfile
                key={user.updatedAt}
                src={src}
                width={120}
                height={120}
              />
              <input
                type="file"
                name="avatar"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                hidden
              />
              <span className="absolute right-4 bottom-4 bg-neutral-background rounded-full p-4 hover:bg-blue-200 group-hover:bg-blue-200">
                <Camera width={24} height={24} />
              </span>
            </label>
          </div>
          {/* name */}
          <div className="flex w-full lg:min-w-592 items-center justify-center">
            <label className="inline-flex flex-col justify-center w-full max-w-480 lg:max-w-592 gap-8">
              <span>name</span>
              <input
                type="text"
                name="name"
                defaultValue={user.name}
                className="h-48 w-full px-12 rounded-[10px] border border-neutral-gray"
              />
            </label>
          </div>
        </div>
        <div className="w-full flex justify-center lg:justify-end gap-24">
          {/* cancel button */}
          <button
            type="button"
            className="h-48 flex-1 max-w-228 lg:max-w-284 border border-neutral-gray rounded-[10px]"
            onClick={() => router.back()}
          >
            <span className="text-subtext">cancel</span>
          </button>
          {/* save button */}
          <button
            className="h-48 flex-1 max-w-228 lg:max-w-284 bg-primary rounded-[10px]"
            disabled={isPending}
          >
            <span className="text-neutral-background">save</span>{' '}
          </button>
        </div>
      </form>
    </>
  )
}

function LoadingPopover() {
  return (
    <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
      <div className="flex flex-col justify-center items-center gap-16 px-24 py-20 bg-neutral-card rounded-[16px] shadow-box min-w-240 min-h-240">
        <div
          className="h-40 w-40 rounded-full border-4 border-neutral-gray border-t-primary animate-spin"
          aria-hidden
        />
        <p className="text-center text-[16px]">saving your profile...</p>
      </div>
    </div>
  )
}
