'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLayoutEffect } from 'react'

export default function CallbackClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useLayoutEffect(() => {
    const accessToken = searchParams.get('accessToken')
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
      router.replace('/dashboard') // 홈으로 리디렉션
    }
  }, [searchParams, router])

  return <></>
}
