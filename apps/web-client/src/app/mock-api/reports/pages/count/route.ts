import { NextRequest, NextResponse } from 'next/server'

import { reportsData } from '@/app/lib/mockData'

export async function GET(req: NextRequest) {
  // 현재 요청의 모든 쿼리 파라미터 가져오기
  const searchParams = req.nextUrl.searchParams

  console.log(searchParams.toString())

  const totalPages = Math.floor((reportsData.length - 1) / 10) + 1

  return NextResponse.json(totalPages)
}
