'use client'

import styles from './table.module.css'

import Dots from '@/../public/icons/dots.svg'

export default function TableHeader() {
  return (
    <div className="w-full flex border-b border-neutral-gray max-h-40 py-8 px-16">
      <div className={`${styles.row} text-neutral-subtext `}>
        <div>title</div>
        <div>company</div>
        <div>job</div>
        <div>date</div>
        <div>score</div>
        <div>duration</div>
      </div>
      <button>
        <Dots width={20} height={20} />
      </button>
    </div>
  )
}
