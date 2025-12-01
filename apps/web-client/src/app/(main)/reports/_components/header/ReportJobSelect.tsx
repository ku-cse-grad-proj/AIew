'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useShallow } from 'zustand/shallow'

import styles from './header.module.css'
import ReportSelect from './ReportSelect'

import { useReportSearchStore } from '@/app/lib/reportSearchStore'

export default function ReportJobSelect() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const { setJob } = useReportSearchStore(
    useShallow((state) => ({
      job: state.job,
      setJob: state.setJob,
    })),
  )

  const defaultValue = searchParams.get('job') || 'total'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setJob(value)
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'total') {
      params.set('job', value)
    } else {
      params.delete('job')
    }
    replace(`${pathname}?${params.toString()}`)
  }
  return (
    <label htmlFor="job" className={styles.labelText}>
      job
      <ReportSelect
        id="job"
        name="job"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-120"
      >
        <option value="total">total</option>
        <option value="web">Web developer</option>
        <option value="app">App developer</option>
      </ReportSelect>
    </label>
  )
}
