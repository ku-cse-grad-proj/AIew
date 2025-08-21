'use server'

import { redirect } from 'next/navigation'

import { privateFetch } from '@/app/lib/fetch'

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

  const coverLetter = formData.get('coverLetter')
  if (coverLetter instanceof File && coverLetter.size > 0) {
    newFormData.append('coverLetter', coverLetter)
  }

  const portfolio = formData.get('portfolio')
  if (portfolio instanceof File && portfolio.size > 0) {
    newFormData.append('portfolio', portfolio)
  }

  console.log('newFormData', newFormData)

  const res = await privateFetch(
    'http://localhost:3000/api/v1/interviews/create',
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
  redirect(`/interview/waiting/${sessionId}`)
}
