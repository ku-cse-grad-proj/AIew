'use client'

import { Camera } from 'lucide-react'
import Form from 'next/form'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { UserResponse } from '@/app/(main)/_types'

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
  action: (formData: FormData) => void | Promise<void>
  isModal?: boolean
}) {
  const router = useRouter()
  const [picUrl, setPicUrl] = useState(user.pic_url)

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
    <Form
      action={action}
      className="w-full flex-1 min-h-320 flex flex-col items-center justify-between gap-48"
    >
      <div
        className={`w-full flex-1 min-h-0 flex flex-col items-center gap-24 ${!isModal ? 'lg:flex-row' : ''}`}
      >
        {/* profile */}
        <div className="w-full min-w-240 flex flex-col gap-24 items-center justify-center pt-24">
          <label className="group hover:cursor-pointer rounded-full relative hover:bg-blue-200">
            <div className="relative w-120 h-120 rounded-full overflow-hidden">
              <Image
                src={picUrl}
                alt={'user profile'}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
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
        <button
          className="h-48 flex-1 max-w-228 lg:max-w-284 border border-neutral-gray rounded-[10px]"
          onClick={() => router.back()}
        >
          <span className="text-subtext">cancel</span>
        </button>
        <button className="h-48 flex-1 max-w-228 lg:max-w-284 bg-primary rounded-[10px]">
          <span className="text-neutral-background">save</span>{' '}
        </button>
      </div>
    </Form>
  )
}
