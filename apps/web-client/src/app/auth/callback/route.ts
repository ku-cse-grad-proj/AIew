import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const accessToken = url.searchParams.get('accessToken')

  if (accessToken) {
    const cookieStore = await cookies()
    cookieStore.set('accessToken', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  // 표준 리디렉션 응답
  return Response.redirect(new URL('/dashboard', request.url))
}
