'use client'
import { useState } from 'react'

import styles from './header.module.css'
import Popover from './popover/Popover'
import PopoverContent from './popover/PopoverContent'
import PopoverTriggeButton from './popover/PopoverTriggerButton'

import Calender from '@/../public/icons/calendar.svg'

export default function ReportCalendarButton() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const formattedToday = new Intl.DateTimeFormat('en-CA').format(new Date())

  const rangeLabel =
    fromDate && toDate
      ? `${fromDate} ~ ${toDate}`
      : fromDate
        ? `${fromDate} ~ `
        : toDate
          ? ` ~ ${toDate}`
          : null

  const dateInputView = `${styles.outline} w-full h-40 px-8`

  return (
    <Popover>
      <PopoverTriggeButton
        className={`min-w-40 min-h-40 inline-flex px-8 gap-8 justify-center items-center ${styles.outline}`}
      >
        <Calender />
        {rangeLabel && <span className="">{rangeLabel}</span>}
      </PopoverTriggeButton>
      <PopoverContent className="flex flex-col absolute bg-neutral-card right-0 mt-4 p-16 gap-8 rounded-[10px] shadow-box z-100">
        <label htmlFor="from" className="text-[14px] text-neutral-subtext">
          from
          <input
            type="date"
            id="from"
            name="from"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate ? toDate : formattedToday}
            className={`${dateInputView}`}
          />
        </label>
        <label htmlFor="to" className="text-[14px] text-neutral-subtext">
          to
          <input
            type="date"
            id="to"
            name="to"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate ?? fromDate}
            max={formattedToday}
            className={`${dateInputView}`}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
