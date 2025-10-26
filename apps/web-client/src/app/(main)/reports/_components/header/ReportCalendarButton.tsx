'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import styles from './header.module.css'
import Popover from './popover/Popover'
import PopoverContent from './popover/PopoverContent'
import PopoverTriggeButton from './popover/PopoverTriggerButton'

import Calender from '@/../public/icons/calendar.svg'
import { useReportSearchStore } from '@/app/lib/reportSearchStore'

export default function ReportCalendarButton() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const { fromDate, toDate, setFromDate, setToDate } = useReportSearchStore(
    useShallow((state) => ({
      fromDate: state.fromDate,
      toDate: state.toDate,
      setFromDate: state.setFromDate,
      setToDate: state.setToDate,
    })),
  )

  const urlFrom = searchParams.get('from') || ''
  const urlTo = searchParams.get('to') || ''
  const displayFrom = fromDate && fromDate.length > 0 ? fromDate : urlFrom
  const displayTo = toDate && toDate.length > 0 ? toDate : urlTo

  useEffect(() => {
    if (urlFrom) {
      setFromDate(urlFrom)
    }
    if (urlTo) {
      setToDate(urlTo)
    }
  }, [urlFrom, urlTo, setFromDate, setToDate])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromDate(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('from', value)
    } else {
      params.delete('from')
    }
    replace(`${pathname}?${params.toString()}`)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToDate(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('to', value)
    } else {
      params.delete('to')
    }
    replace(`${pathname}?${params.toString()}`)
  }

  const formattedToday = new Intl.DateTimeFormat('en-CA').format(new Date())

  const rangeLabel =
    displayFrom && displayTo
      ? `${displayFrom} ~ ${displayTo}`
      : displayFrom
        ? `${displayFrom} ~ `
        : displayTo
          ? ` ~ ${displayTo}`
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
      <PopoverContent className={`${styles.popoverContent}`}>
        <label htmlFor="from" className={styles.labelText}>
          from
          <input
            type="date"
            id="from"
            name="from"
            value={displayFrom}
            onChange={handleFromChange}
            max={displayTo || formattedToday}
            className={`${dateInputView}`}
          />
        </label>
        <label htmlFor="to" className={styles.labelText}>
          to
          <input
            type="date"
            id="to"
            name="to"
            value={displayTo}
            onChange={handleToChange}
            min={displayFrom || ''}
            max={formattedToday}
            className={`${dateInputView}`}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
