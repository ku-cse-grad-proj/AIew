import Image from 'next/image'
import Link from 'next/link'

export type Interview = {
  id: string
  title: string
  company: string
  jobTitle: string
  jobSpec: string
  createdAt: string
  status?: 'ready' | 'draft' | 'done'
}

export default function InterviewCard({
  data,
  onDelete,
}: {
  data: Interview
  onDelete?: (id: string) => void
}) {
  const {
    id,
    title,
    company,
    jobTitle,
    jobSpec,
    createdAt,
    status = 'ready',
  } = data

  return (
    <article className="relative min-w-50 min-h-280 p-24 rounded-[20px] bg-neutral-card flex flex-col justify-between shadow-box">
      {/* InterviewCard 클릭시 waiting room으로 이동 */}
      <Link
        href={`/interview/waiting/${id}`}
        className="absolute inset-0 rounded-[20px] z-0"
      >
        <span className="sr-only">인터뷰 대기 화면으로 이동</span>
      </Link>

      {/* 질문 준비 상태와 날짜 */}
      {/* TODO: 상태값 변화 어떻게 인식할지 */}
      <header className="w-full flex justify-between items-center">
        <div className="px-28 text-neutral-inverse bg-success rounded-full inline-flex items-center h-32">
          {status}
        </div>
        <span className="text-neutral-subtext">
          {new Date(createdAt).toISOString().split('T')[0]}
        </span>
      </header>

      <h2 className="text-[28px] leading-[48px] font-semibold">{title}</h2>

      <dl>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            company name
          </dt>
          <dd className="leading-[24px]">{company}</dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            job
          </dt>
          <dd className="leading-[24px]">
            {jobTitle} &gt; {jobSpec}
          </dd>
        </div>
      </dl>

      <footer className="flex justify-between items-center h-40">
        <div className="flex gap-8 h-32">
          <button
            type="button"
            className="px-10 text-neutral-subtext flex items-center justify-center gap-6 z-10"
            onClick={(e) => {
              e.preventDefault()
              // TODO: open edit screen
            }}
          >
            <Image
              src="/icons/edit.svg"
              alt="edit icon"
              width={12}
              height={12}
            />
            edit
          </button>
          <button
            type="button"
            className="px-10 text-error flex items-center justify-center gap-6 z-10"
            onClick={(e) => {
              e.preventDefault()
              onDelete?.(id)
            }}
          >
            <Image
              src="/icons/delete.svg"
              alt="delete icon"
              width={12}
              height={12}
            />
            delete
          </button>
        </div>
        <Link
          className="bg-primary rounded-[10px] text-neutral-inverse px-20 h-40 flex items-center justify-center z-10"
          href={`/interview/waiting/${id}`}
        >
          start interview
        </Link>
      </footer>
    </article>
  )
}
