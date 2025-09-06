import { RedirectType } from 'next/navigation'

/**
 * @description 인증이 필요한 API 요청을 위한 fetch 래퍼 함수.
 * 모든 요청에 자동으로 인증 쿠키를 포함시키고, 토큰 만료 시 재발급을 시도합니다.
 */
export async function privateFetch<T>(
  input: RequestInfo,
  init: RequestInit = {},
  _retry = false,
): Promise<Response> {
  const isServer = typeof window === 'undefined'
  const finalInit: RequestInit = { ...init }

  if (isServer) {
    // 서버 환경일 경우, 'next/headers'에서 쿠키를 가져와 수동으로 헤더에 추가합니다.
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')

    finalInit.headers = {
      ...finalInit.headers,
      Cookie: cookieHeader,
    }
  } else {
    // 클라이언트 환경일 경우, 브라우저가 쿠키를 자동으로 포함하도록 설정합니다.
    finalInit.credentials = 'include'
  }

  // 최종적으로 구성된 init 객체로 API를 호출합니다.
  const res = await fetch(input, finalInit)
  if (res.status !== 401) {
    return res
  }

  // 401 에러 발생 시, 서버 환경에서는 즉시 로그인 페이지로 리디렉션합니다.
  if (isServer) {
    // 서버 환경에서는 Next.js의 redirect 유틸을 사용해 즉시 로그인 페이지로 보냅니다.
    // (주의: 이 코드는 서버 컴포넌트/액션 컨텍스트에서만 동작합니다.)
    const { redirect } = await import('next/navigation')
    redirect('/login', RedirectType.replace)
  }

  // 클라이언트: 1회만 refresh 시도
  // res == ok이지만 쿠키 설정을 실패할 경우 무한루프에 빠질 수 있음
  if (!_retry && !String(input).includes('/api/v1/refresh')) {
    const rr = await fetch('/api/v1/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (rr.ok) {
      return privateFetch<T>(input, init, true) // 한 번만 재시도
    }
  }

  // 재발급 실패 시, 로그인 페이지로 리디렉션합니다.
  window.location.href = '/login'
  // 리디렉션 후에는 더 이상 진행되지 않도록 빈 응답을 반환합니다.
  return new Response(null, { status: 302 })
}
