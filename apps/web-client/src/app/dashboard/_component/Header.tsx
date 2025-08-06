import { privateFetch } from '@/app/lib/fetch'

export default async function DashboardHeader() {
  const res = await privateFetch('http://localhost:3000/api/v1/me')

  if (!res.ok) {
    // 에러 처리 (예: 토큰 만료 등)
    return <div>유저 정보를 가져올 수 없습니다.</div>
  }

  const user = await res.json()

  return (
    <div
      className="w-full h-20 bg-white/10 rounded-[20px] 
        shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] border border-white/20"
    >
      {user.name}
    </div>
  )
}
