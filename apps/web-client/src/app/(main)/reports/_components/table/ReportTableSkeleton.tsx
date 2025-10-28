import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default function ReportTableSkeleton() {
  return (
    <div className={`${styles.table}`}>
      <div className="w-full flex border-b border-neutral-gray py-8 px-16">
        <div className={`${styles.row} text-neutral-subtext `}>
          <span>title</span>
          <span>company</span>
          <span>job</span>
          <span>date</span>
          <span>score</span>
          <span>duration</span>
        </div>
        <button>
          <Dots width={20} height={20} />
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-col justify-around px-8 overflow-y-auto">
        {Array.from({ length: 10 }, (_, i) => i).map((i) => (
          <div
            key={i}
            className="w-full min-h-40 py-8 bg-gray-200 animate-pulse rounded-[10px]"
          ></div>
        ))}
      </div>
    </div>
  )
}
