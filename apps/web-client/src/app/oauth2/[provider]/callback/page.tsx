'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function CallbackClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
      router.replace('/dashboard') // 홈으로 리디렉션
    }
  }, [searchParams, router])

  return <p>로그인 처리 중입니다...</p>
}
