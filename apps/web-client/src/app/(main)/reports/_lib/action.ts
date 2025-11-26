'use server'

import { updateTag } from 'next/cache'

import { deleteInterview } from '../../interview/_lib/api'

import { CACHE_TAG } from '@/constants/cacheTags'

export async function removeReport(id: string) {
  //report는 interview에서 불러오는 데이터이므로 interview를 삭제하면 report도 함께 삭제됨
  await deleteInterview(id)
  updateTag(CACHE_TAG.REPORTS)
}
