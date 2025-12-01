'use client'

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
}: {
  user: UserResponse
  action: (formData: FormData) => void | Promise<void>
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
    <Form action={action} className="w-full flex flex-col items-center">
      {/* profile */}
      <div className="w-full min-w-240 max-w-320 flex flex-col gap-24 items-center justify-center p-24">
        <div className="relative w-120 h-120 rounded-full overflow-hidden">
          <Image
            src={picUrl}
            alt={'user profile'}
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
        <label className="w-full py-8 border border-subtext rounded-[10px] hover:cursor-pointer inline-flex items-center justify-center">
          <input
            type="file"
            name="avatar"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileChange}
            hidden
          />
          <span className="text-subtext">change profile</span>
        </label>
      </div>
      <div>
        <button onClick={() => router.back()}>cancel</button>
        <button className="bg-primary">save</button>
      </div>
    </Form>
  )
}
