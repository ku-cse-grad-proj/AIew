'use server'

import { privateFetch } from '@/app/lib/fetch'

export async function patchUserProfile(
  userId: string,
  body: { name?: string; pic_url?: string },
) {
  const { CORE_API_URL, API_PREFIX } = process.env
  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    throw new Error('프로필 정보를 수정하지 못했습니다.')
  }

  return await response.json()
}

export async function uploadUserAvatar(userId: string, file: File) {
  const { CORE_API_URL, API_PREFIX } = process.env
  const formData = new FormData()
  formData.append('file', file)

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/users/${userId}/avatar`,
    {
      method: 'PUT',
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error('프로필 이미지를 업로드하지 못했습니다.')
  }

  return await response.json()
}
