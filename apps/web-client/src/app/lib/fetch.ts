import 'server-only'
import { cookies } from 'next/headers'
import { redirect, RedirectType } from 'next/navigation'

/**
 * 인증이 필요한 API 요청을 위한 서버 전용 fetch 래퍼.
 *
 * Server Component / Server Action 에서만 사용해야 합니다.
 * 토큰 갱신은 proxy(미들웨어)가 전담하므로, 이 함수는 갱신을 시도하지 않습니다.
 * 401 응답 시 `/login`으로 리디렉션합니다.
 */
export async function privateFetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const res = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: cookieHeader,
    },
  })

  if (res.status === 401) {
    redirect('/login', RedirectType.replace)
  }

  return res
}
