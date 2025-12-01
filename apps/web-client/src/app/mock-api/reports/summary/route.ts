import { NextResponse } from 'next/server'

import { reportsData } from '@/app/lib/mockData'

export async function GET() {
  const totalReports = reportsData.length

  const averageDuration =
    reportsData.reduce((sum, r) => sum + parseInt(r.duration), 0) / totalReports

  const averageScore =
    reportsData.reduce((sum, r) => sum + r.score, 0) / totalReports
  const summary = {
    totalReports,
    averageScore: Number(averageScore.toFixed(1)),
    averageDuration: Math.round(averageDuration),
    mostFrequentCompany: '배달의 민족',
  }

  return NextResponse.json(summary)
}
