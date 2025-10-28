import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  //prefligth 경우에는 auth 검사 제외
  if (req.method === 'OPTIONS') {
    return NextResponse.next()
  }

  const { pathname } = new URL(req.url)

  //auth 검사 필요 없는 page 및 api
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/v1/refresh') ||
    pathname.startsWith('/mock-api')
  ) {
    return NextResponse.next()
  }
  const accessToken = req.cookies.get('accessToken')?.value
  const refreshToken = req.cookies.get('refreshToken')?.value

  // refresh token조차 없으면 무조건 로그인 페이지로
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 토큰이 존재하고, 유효하면, 요청을 그대로 통과
  if (accessToken && !isJwtExpired(accessToken)) {
    return NextResponse.next()
  }

  // access token이 없거나 유효하지 않으면 refresh 시도
  return await tryRefresh(req)
}

/**
 * Refresh Token을 사용하여 새로운 Access Token을 발급받고,
 * 성공 시 쿠키를 설정하여 다음 요청으로 넘기고,
 * 실패 시 로그인 페이지로 리디렉션
 */
async function tryRefresh(req: NextRequest) {
  const { CORE_API_URL, API_PREFIX } = process.env
  const refreshRes = await fetch(`${CORE_API_URL}/${API_PREFIX}/refresh`, {
    method: 'POST',
    headers: {
      // 서버 사이드에서 fetch를 할 때는 브라우저가 아니므로 쿠키를 수동으로 담아줘야 함
      Cookie: req.headers.get('cookie') ?? '',
    },
  })

  // 리프레시 성공 (204 No Content)
  if (refreshRes.ok) {
    // 백엔드가 쿠키를 설정했으므로, 프론트엔드는 단순히 요청을 다시 시도하면 됩니다.
    // 하지만 미들웨어에서는 원래 요청을 다시 보내는 대신,
    // 리디렉션을 통해 브라우저가 새로운 쿠키와 함께 페이지를 다시 로드하도록 유도하는 것이
    // 가장 간단하고 안정적인 방법입니다.
    const response = NextResponse.redirect(req.url)

    // 백엔드가 Set-Cookie 헤더를 보냈을 것이므로,
    // 해당 헤더를 브라우저로 전달해줘야 쿠키가 설정됩니다.
    const newAccessTokenCookie = refreshRes.headers.get('set-cookie')
    if (newAccessTokenCookie) {
      response.headers.set('set-cookie', newAccessTokenCookie)
    }

    return response
  }

  // refresh 실패 (refresh token도 만료됨)
  return NextResponse.redirect(new URL('/login', req.url))
}

//JWT의 exp의 값이 만료됐는지 확인하는 함수
function isJwtExpired(token: string, skewMs = 5000): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as { exp?: number }
    if (!payload.exp || typeof payload.exp !== 'number') return true
    //exp는 초 단위, Date.now()는 ms단위기에 1000을 곱해줌
    const nowMs = Date.now()
    const expMs = payload.exp * 1000
    return expMs <= nowMs + skewMs
  } catch {
    return true
  }
}

export const config = {
  matcher: [
    // 1) 모든 페이지 라우트(정적 자원/이미지/파비콘 등은 제외)
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|assets|images|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt)$).*)',
    // 2) API 라우트 전부 포함
    '/api/:path*',
  ],
}
