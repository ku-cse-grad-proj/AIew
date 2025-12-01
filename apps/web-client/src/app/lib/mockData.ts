export const reportsData = Array.from({ length: 223 }, (_, i) => {
  const companies = [
    '배달의민족',
    '토스',
    '카카오',
    '네이버',
    '라인',
    '쿠팡',
    '삼성 SDS',
    'LG CNS',
  ]
  const jobTitles = ['web', 'app']
  const jobSpecs = ['front', 'back']
  const company = companies[i % companies.length]
  const jobTitle = jobTitles[i % jobTitles.length]
  const jobSpec = jobSpecs[i % jobSpecs.length]
  const score = +(Math.random() * 2 + 3).toFixed(1)
  const duration = `${45 + (i % 15)}`
  const date = `2025-09-${String(30 - (i % 20)).padStart(2, '0')}`

  return {
    id: i + 1,
    title: `${company} interview`,
    company,
    jobTitle,
    jobSpec,
    date,
    score,
    duration,
  }
})

const labels: string[] = [
  '배달의민족 1',
  '삼성',
  '네이버',
  '카카오',
  '토스',
  '라인',
  '쿠팡',
  'LG CNS',
  '삼성 SDS',
  '네이버 2',
]

// 0~5 사이 소수점 한 자리 점수
const scores = labels.map(() => +(Math.random() * 5).toFixed(1))

// 30~70 사이 정수 duration (분)
const durations = labels.map(() => Math.floor(Math.random() * 41) + 30)

// 최종 데이터
export const lineGraphData = [labels, scores, durations] as [
  string[],
  number[],
  number[],
]

export const companyCount = [
  ['배달의민족', '카카오', '토스', '네이버', '쿠팡', 'Others'],
  [4, 3, 2, 2, 1, 2],
] as [string[], number[]]
