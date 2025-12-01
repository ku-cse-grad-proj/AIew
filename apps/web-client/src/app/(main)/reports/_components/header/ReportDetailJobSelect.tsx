'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useShallow } from 'zustand/shallow'

import styles from './header.module.css'
import ReportSelect from './ReportSelect'

import { useReportSearchStore } from '@/app/lib/reportSearchStore'

export default function ReportDetailJobSelect() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const { setDetailJob } = useReportSearchStore(
    useShallow((state) => ({
      detailJob: state.detailJob,
      setDetailJob: state.setDetailJob,
    })),
  )

  const defaultValue = searchParams.get('detailJob') || 'total'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setDetailJob(value)
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'total') {
      params.set('detailJob', value)
    } else {
      params.delete('detailJob')
    }
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <label htmlFor="detailJob" className={styles.labelText}>
      detail job
      <ReportSelect
        id="detailJob"
        name="detailJob"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-120"
      >
        <option value="total">total</option>
        <option value="front">Frontend</option>
        <option value="back">Backend</option>
      </ReportSelect>
    </label>
  )
}
