'use server'

import { updateTag } from 'next/cache'

import { deleteReport } from './api'

import { CACHE_TAG } from '@/constants/cacheTags'

export async function removeReport(id: string) {
  await deleteReport(id)
  updateTag(CACHE_TAG.REPORTS)
}
