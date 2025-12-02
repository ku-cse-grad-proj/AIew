'use server'

import { updateTag } from 'next/cache'

import { patchUserProfile, uploadUserAvatar } from './api'

import { getUser } from '@/app/(main)/_lib/api'
import { CACHE_TAG } from '@/constants/cacheTags'

export type UpdateProfileState = {
  ok: boolean
  error?: string
}

export interface UpdateProfileAction {
  (
    _prevState: UpdateProfileState,
    formData: FormData,
  ): UpdateProfileState | Promise<UpdateProfileState>
}

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  try {
    const user = await getUser()
    const nameValue = formData.get('name')
    const nextName = typeof nameValue === 'string' ? nameValue.trim() : ''
    const avatarFile = formData.get('avatar')

    if (nextName !== user.name) {
      await patchUserProfile(user.id, { name: nextName })
    }

    if (avatarFile instanceof File && avatarFile.size > 0) {
      await uploadUserAvatar(user.id, avatarFile)
    }

    //유저 정보 revalidate
    updateTag(CACHE_TAG.USER)

    return { ok: true }
  } catch (e) {
    console.error(e)
    return {
      ok: false,
      error: 'profile 변경 중 오류가 발생했습니다',
    }
  }
}
