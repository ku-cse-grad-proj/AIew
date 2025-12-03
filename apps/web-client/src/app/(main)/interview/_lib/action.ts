'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  appendCreateData,
  appendFiles,
  appendUpdateData,
} from '../create/_lib/append'
import { waitUntilFilesProcessed } from '../create/_lib/wait'

import { deleteInterview, patchInterview, postInterview } from './api'

import { CACHE_TAG } from '@/constants/cacheTags'

function redirectToWaiting(id: string) {
  redirect(`/interview/waiting/${id}`)
}

export async function createInterview(formData: FormData) {
  const newFormData = new FormData()

  //formData로 받는 형식과 back에서 필요로 하는 형식이 다르므로 변환 필요
  appendCreateData(formData, newFormData)
  appendFiles(formData, newFormData)

  const { sessionId } = await postInterview(newFormData)

  await waitUntilFilesProcessed(sessionId, formData)
  updateTag(CACHE_TAG.INTERVIEWS)
  redirectToWaiting(sessionId)
}

export async function updateInterview(
  formData: FormData,
  interview?: Interview,
) {
  const newFormData = new FormData()

  if (!interview) throw new Error('patch할 interview가 존재하지 않습니다.')

  //formData로 받는 형식과 back에서 필요로 하는 형식이 다르므로 변환 필요
  appendUpdateData(formData, newFormData, interview)
  //size > 0 이면 새로운 파일임을 의미
  appendFiles(formData, newFormData)

  //변경된 값이 없을 경우 바로 waiting room으로 넘어감
  if ([...newFormData.keys()].length === 0) {
    redirectToWaiting(interview.id)
  }

  const { id } = await patchInterview(interview.id, newFormData)

  updateTag(CACHE_TAG.INTERVIEWS)
  await waitUntilFilesProcessed(id, formData)
  updateTag(CACHE_TAG.INTERVIEW(id))

  redirectToWaiting(id)
}

export async function removeInterview(id: string) {
  await deleteInterview(id)
  updateTag(CACHE_TAG.INTERVIEWS)
}

export async function revalidateInterview(id: string) {
  updateTag(CACHE_TAG.INTERVIEWS)
  updateTag(CACHE_TAG.INTERVIEW(id))
}

export async function revalidateInterviewAndReports(id: string) {
  await revalidateInterview(id)
  updateTag(CACHE_TAG.REPORTS)
}
