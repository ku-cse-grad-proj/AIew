import Link from 'next/link'

import EmptyMessage from './EmptyMessage'

export default function EmptyInterview() {
  return (
    <div className="h-full min-h-200 flex flex-col">
      <EmptyMessage
        main="Create one to start!"
        sub="No ongoing or ready interviews"
      />
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
