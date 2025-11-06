import Link from 'next/link'

export default function EmptyInterview() {
  return (
    <div className="h-full min-h-200 flex flex-col">
      <div className="flex-1 min-h-48 flex flex-col items-center justify-center gap-8">
        <p className="text-[20px] font-medium text-shadow-xs">
          Create one to start!
        </p>
        <p className="text-[16px] text-neutral-subtext ">
          No ongoing or ready interviews
        </p>
      </div>
      <div className="flex justify-end">
        <Link
          href={'/interview/create'}
          className="px-24 py-12 rounded-[10px] bg-neutral-gray font-medium"
        >
          create interview
        </Link>
      </div>
    </div>
  )
}
