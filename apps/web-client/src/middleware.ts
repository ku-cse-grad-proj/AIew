import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const access = req.cookies.get('accessToken')?.value

  //accessToken이 없으면 refresh 요청
  if (!access) {
    const refreshRes = await fetch(`http://localhost:3000/api/v1/refresh`, {
      method: 'POST',
      headers: {
        Cookie: req.headers.get('cookie') ?? '',
      },
    })

    // refresh 성공 시 쿠키 설정
    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json()
      const res = NextResponse.next()

      res.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
      return res
    }

    // refresh 실패 시 로그인 페이지로 리디렉션
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

//TODO: private 주소 한 파일로 변경해 관리하기 쉽도록 변경
export const config = {
  matcher: ['/dashboard/:path*', '/api/me', '/settings/:path*'],
}
