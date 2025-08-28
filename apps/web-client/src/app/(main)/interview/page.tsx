import Link from 'next/link'

import InterviewCard from './_components/InterviewCard'

export default function InterviewPage() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-[40px] font-bold leading-[72px]">interview</h1>
        <Link
          className="text-neutral-inverse text-[20px] p-20 bg-secondary hover:bg-secondary-hover rounded-[20px] shadow-box"
          href={'/interview/create'}
        >
          create interview
        </Link>
      </div>
      <div>
        <InterviewCard />
      </div>
    </div>
  )
}
