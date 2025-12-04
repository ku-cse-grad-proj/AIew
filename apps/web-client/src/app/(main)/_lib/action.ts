'use server'

import { updateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { signOut } from './api'

import { CACHE_TAG } from '@/constants/cacheTags'

export async function handleSignOut() {
  await signOut()

  // 브라우저 쿠키 삭제 (core-api의 clearCookie는 서버-서버 호출이라 브라우저에 전달 안 됨)
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')

  updateTag(CACHE_TAG.USER)
  updateTag(CACHE_TAG.DASHBOARD)
  updateTag(CACHE_TAG.INTERVIEWS)
  updateTag(CACHE_TAG.REPORTS)
  redirect('/')
}
