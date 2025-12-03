'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { signOut } from './api'

import { CACHE_TAG } from '@/constants/cacheTags'

export async function handleSignOut() {
  await signOut()
  updateTag(CACHE_TAG.USER)
  updateTag(CACHE_TAG.DASHBOARD)
  updateTag(CACHE_TAG.INTERVIEWS)
  updateTag(CACHE_TAG.REPORTS)
  redirect('/')
}
