import Link from 'next/link'

import Carousel from './_components/Carousel'
import { Interview } from './_components/InterviewCard'

export default function InterviewPage() {
  // 임시 더미 데이터 (API 연결 전까지)
  const cards: Interview[] = [
    {
      id: '101',
      title: '배달의 민족 interview',
      company: '배달의 민족',
      jobTitle: 'web developer',
      jobSpec: 'frontend',
      createdAt: '2025-08-27T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '102',
      title: '카카오 interview',
      company: '카카오',
      jobTitle: 'frontend',
      jobSpec: 'engineer',
      createdAt: '2025-08-25T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '103',
      title: '네이버 interview',
      company: '네이버',
      jobTitle: 'web',
      jobSpec: 'platform',
      createdAt: '2025-08-24T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '104',
      title: '토스 interview',
      company: '토스',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-23T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '105',
      title: '라인 interview',
      company: '라인',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-22T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '106',
      title: '쿠팡 interview',
      company: '쿠팡',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-21T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '107',
      title: '무신사 interview',
      company: '무신사',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-20T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '108',
      title: '요기요 interview',
      company: '요기요',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-19T00:00:00.000Z',
      status: 'ready',
    },
    {
      id: '109',
      title: '배민상회 interview',
      company: '우아한형제들',
      jobTitle: 'FE',
      jobSpec: '',
      createdAt: '2025-08-18T00:00:00.000Z',
      status: 'ready',
    },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-[40px] font-bold leading-[72px]">interview</h1>
        <Link
          className="text-neutral-inverse text-[20px] p-16 bg-secondary hover:bg-secondary-hover rounded-[20px] shadow-box"
          href={'/interview/create'}
        >
          create interview
        </Link>
      </div>
      <Carousel cards={cards} />
    </div>
  )
}
