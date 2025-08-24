import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const accessToken = url.searchParams.get('accessToken')

  if (accessToken) {
    const cookieStore = await cookies()
    cookieStore.set('accessToken', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60, // 초 단위
      sameSite: 'lax',
      path: '/', // 전체 경로에서 사용 가능
    })
  }

  // 표준 리디렉션 응답
  return Response.redirect(new URL('/dashboard', request.url))
}
