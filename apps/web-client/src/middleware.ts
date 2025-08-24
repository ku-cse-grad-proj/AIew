import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('accessToken')?.value
  const refreshToken = req.cookies.get('refresh_token')?.value

  // refresh token조차 없으면 무조건 로그인 페이지로
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // access token이 없는 경우, 즉시 refresh 시도
  if (!accessToken) {
    return await tryRefresh(req)
  }

  // access token이 있는 경우, 유효성 검증
  const meResponse = await fetch('http://localhost:3000/api/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // 토큰이 유효하면, 요청을 그대로 통과
  if (meResponse.ok) {
    return NextResponse.next()
  }

  // 토큰이 유효하지 않으면 refresh 시도
  return await tryRefresh(req)
}

/**
 * Refresh Token을 사용하여 새로운 Access Token을 발급받고,
 * 성공 시 쿠키를 설정하여 다음 요청으로 넘기고,
 * 실패 시 로그인 페이지로 리디렉션
 */
async function tryRefresh(req: NextRequest) {
  const refreshRes = await fetch('http://localhost:3000/api/v1/refresh', {
    method: 'POST',
    headers: {
      // 서버 사이드에서 fetch를 할 때는 브라우저가 아니므로 쿠키를 수동으로 담아줘야 함
      Cookie: req.headers.get('cookie') ?? '',
    },
  })

  // 리프레시 성공
  if (refreshRes.ok) {
    const { accessToken: newAccessToken } = await refreshRes.json()
    // 다음 요청으로 보내기 위한 새로운 응답 객체를 생성합니다.
    const response = NextResponse.next()
    // 새로운 액세스 토큰을 쿠키에 설정합니다.
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  // refresh 실패 (refresh token도 만료됨)
  return NextResponse.redirect(new URL('/login', req.url))
}

//TODO: private 주소 한 파일로 변경해 관리하기 쉽도록 변경
export const config = {
  matcher: ['/dashboard/:path*', '/api/me', '/settings/:path*'],
}
