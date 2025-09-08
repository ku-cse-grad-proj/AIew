'use server'

import { redirect } from 'next/navigation'

import { privateFetch } from '@/app/lib/fetch'

function redirectToWaiting(id: string) {
  redirect(`/interview/waiting/${id}`)
}

function appendFiles(formData: FormData, newFormData: FormData) {
  const coverLetter = formData.get('coverLetter')
  if (coverLetter instanceof File && coverLetter.size > 0) {
    newFormData.append('coverLetter', coverLetter)
  }

  const portfolio = formData.get('portfolio')
  if (portfolio instanceof File && portfolio.size > 0) {
    newFormData.append('portfolio', portfolio)
  }
}

export async function createInterview(formData: FormData) {
  const newFormData = new FormData()

  newFormData.append(
    'company',
    JSON.stringify({ value: formData.get('company') }),
  )
  newFormData.append(
    'jobTitle',
    JSON.stringify({ value: formData.get('jobTitle') }),
  )
  newFormData.append(
    'jobSpec',
    JSON.stringify({ value: formData.get('jobSpec') }),
  )
  newFormData.append(
    'idealTalent',
    JSON.stringify({ value: formData.get('idealTalent') }),
  )

  appendFiles(formData, newFormData)

  const res = await privateFetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/interviews`,
    {
      method: 'POST',
      body: newFormData,
    },
  )

  if (!res.ok) {
    throw new Error('면접 생성에 실패했습니다.')
  }

  const { sessionId } = await res.json()
  console.log('sessionId', sessionId)
  redirectToWaiting(sessionId)
}

export async function patchInterview(formData: FormData, interview: Interview) {
  const newFormData = new FormData()

  const EDITABLE_KEYS = [
    'title',
    'company',
    'jobTitle',
    'jobSpec',
    'idealTalent',
  ] as const

  //기존 interview와 다른 값일 경우에만 newFormData에 포함시킴
  for (const key of EDITABLE_KEYS) {
    const raw = formData.get(key)
    const newVal = typeof raw === 'string' ? raw : null
    const oldVal = interview[key] // string

    if (newVal !== null && newVal !== oldVal) {
      newFormData.append(key, JSON.stringify({ set: newVal }))
    }
  }

  //size > 0 이면 새로운 파일임을 의미
  appendFiles(formData, newFormData)

  //변경된 값이 없을 경우 바로 waiting room으로 넘어감
  if ([...newFormData.keys()].length === 0) {
    console.log('No changes detected')
    redirectToWaiting(interview.id)
  }

  const res = await privateFetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/interviews/${interview.id}`,
    { method: 'PATCH', body: newFormData },
  )
  if (!res.ok) throw new Error('면접 수정에 실패했습니다.')
  redirectToWaiting(interview.id)
}
