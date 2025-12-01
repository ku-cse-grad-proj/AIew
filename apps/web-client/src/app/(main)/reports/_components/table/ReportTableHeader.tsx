'use client'

import HeaderSortButton from './HeaderSortButton'
import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default function TableHeader() {
  return (
    <div className="w-full flex border-b border-neutral-gray py-8 px-16">
      <div className={`${styles.row} text-neutral-subtext `}>
        <HeaderSortButton label="title" />
        <HeaderSortButton label="company" />
        <HeaderSortButton label="job" />
        <HeaderSortButton label="date" />
        <HeaderSortButton label="score" />
        <HeaderSortButton label="duration" />
      </div>
      <button>
        <Dots width={20} height={20} />
      </button>
    </div>
  )
}
