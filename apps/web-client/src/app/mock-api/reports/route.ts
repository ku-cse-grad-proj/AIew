import { NextRequest, NextResponse } from 'next/server'

import { reportsData } from '@/app/lib/mockData'

//page에 따라 10개의 reports만 반환
//page 값이 없다면 1을 의미
export async function GET(req: NextRequest) {
  // 현재 요청의 모든 쿼리 파라미터 가져오기
  const searchParams = req.nextUrl.searchParams
  const currentPage = Number(searchParams.get('page') ?? 1) // 문자열 → 숫자 변환

  const startIndex = (currentPage - 1) * 10
  const endIndex = startIndex + 10 // 10개 단위

  // 단순히 배열 길이까지만 잘라줍니다.
  const pages = reportsData.slice(startIndex, endIndex)

  return NextResponse.json(pages)
}
