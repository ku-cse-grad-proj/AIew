export async function GET(request: Request) {
  // 백엔드에서 모든 인증 쿠키를 설정했으므로, 바로 dashboard로 redirect
  return Response.redirect(new URL('/dashboard', request.url))
}
