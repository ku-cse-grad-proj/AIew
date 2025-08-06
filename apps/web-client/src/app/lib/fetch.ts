import { cookies } from 'next/headers'

export async function privateFetch<T>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const isServer = typeof window === 'undefined'

  let accessToken
  if (isServer) {
    accessToken = (await cookies()).get('accessToken')?.value
  } else {
    accessToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1]
  }

  // 2) 실제 호출
  const res = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (res.status !== 401) return res

  //서버일 경우 error 처리
  if (isServer) {
    throw new Error('Unauthenticated')
  }

  // 3) 401 → refresh 시도
  const refreshRes = await fetch('http://localhost:3000/api/v1/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  // 4) refresh 성공 시 쿠키 설정
  if (!isServer && refreshRes.ok) {
    document.cookie = `accessToken=${await refreshRes.json().then((data) => data.accessToken)}; path=/; samesite=lax`
  }
  if (!refreshRes.ok) {
    window.location.href = '/login'
  }

  // 5) 원 요청 재귀 재시도
  return privateFetch<T>(input, init)
}
