import { redirect } from 'next/navigation'

export async function GET() {
  // 백엔드에서 모든 인증 쿠키를 설정했으므로, 바로 dashboard로 redirect
  redirect('/dashboard')
}
