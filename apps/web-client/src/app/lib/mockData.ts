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
