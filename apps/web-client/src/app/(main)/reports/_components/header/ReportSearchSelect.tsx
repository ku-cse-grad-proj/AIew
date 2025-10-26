'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useShallow } from 'zustand/shallow'

import ReportSelect from './ReportSelect'

import { useReportSearchStore } from '@/app/lib/reportSearchStore'

export default function ReportSearchSelect() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const { searchValue, setSearchType } = useReportSearchStore(
    useShallow((state) => ({
      searchValue: state.searchValue,
      setSearchType: state.setSearchType,
    })),
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'title' | 'company'
    setSearchType(value)
    const params = new URLSearchParams(searchParams)
    params.delete('title')
    params.delete('company')
    if (searchValue) {
      params.set(value, searchValue)
    }
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <ReportSelect
      name="search_section"
      defaultValue={searchParams.get('company') ? 'company' : 'title'}
      className="min-w-120"
      onChange={handleChange}
    >
      <option value="title">title</option>
      <option value="company">company</option>
    </ReportSelect>
  )
}
