import Image from 'next/image'
import Link from 'next/link'

export default function InterviewCard() {
  return (
    <div className="w-520 h-280 p-24 rounded-[20px] bg-neutral-card flex flex-col justify-between shadow-box">
      <div className="w-full flex justify-between items-center">
        <div className="px-28 text-neutral-inverse bg-success rounded-full inline-flex items-center h-32">
          ready
        </div>
        <span className="text-neutral-subtext">2025.08.27</span>
      </div>
      <h2 className="text-[28px] leading-[48px] font-semibold">
        배달의 민족 interview
      </h2>
      <dl>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            company name
          </dt>
          <dd className="leading-[24px]">배달의 민족</dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[18px] text-neutral-subtext">
            job
          </dt>
          <dd className="leading-[24px]">web developer &gt; frontend</dd>
        </div>
      </dl>
      <div className="flex justify-between items-center h-40">
        <div className="flex gap-8 h-32">
          <button className="px-10 text-neutral-subtext flex items-center justify-center gap-6">
            <Image
              src="/icons/edit.svg"
              alt="edit icon"
              width={12}
              height={12}
            />
            edit
          </button>
          <button className="px-10 text-error flex items-center justify-center gap-6">
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
          className="bg-primary rounded-[10px] text-neutral-inverse px-20 h-40 flex items-center justify-center"
          href={'/interview/waiting'}
        >
          start interview
        </Link>
      </div>
    </div>
  )
}
