import { Query } from '../../page'

import ReportInfo from './ReportInfo'

import { privateFetch } from '@/app/lib/fetch'

export default async function ReportInfos({ query }: { query: Query }) {
  const { CORE_API_URL, API_PREFIX } = process.env

  const response = await privateFetch(
    `${CORE_API_URL}/${API_PREFIX}/reports/summary?${new URLSearchParams(query)}`,
    { cache: 'no-store' },
  )
  const data = await response.json()

  const mostFrequentCompany = data.mostFrequentCompany
  //일치하는 값이 없다면 response로 N/A가 온다.
  const haveResult = mostFrequentCompany !== 'N/A'

  const reportInfos = [
    { title: 'total reports count', description: data.totalReports },
    {
      title: 'average score',
      description: haveResult ? data.averageScore : '-',
    },
    {
      title: 'average duration',
      description: haveResult ? `${data.averageDuration} min` : '-',
    },
    {
      title: 'most frequent company',
      description: haveResult ? mostFrequentCompany : '-',
    },
  ]
  return (
    <dl className="w-full flex justify-between gap-16 pt-16">
      {reportInfos.map((info, i) => (
        <ReportInfo key={i} title={info.title} description={info.description} />
      ))}
    </dl>
  )
}
