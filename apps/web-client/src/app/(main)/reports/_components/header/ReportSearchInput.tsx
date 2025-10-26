'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useShallow } from 'zustand/shallow'

import styles from './header.module.css'

import Search from '@/../public/icons/search.svg'
import { useReportSearchStore } from '@/app/lib/reportSearchStore'

export default function ReportSearchInput() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const { searchType, setSearchValue } = useReportSearchStore(
    useShallow((state) => ({
      searchType: state.searchType,
      searchValue: state.searchValue,
      setSearchValue: state.setSearchValue,
    })),
  )

  const defaultInputValue =
    searchParams.get('company') || searchParams.get('title') || ''

  useEffect(() => {
    const defaultInputValue =
      searchParams.get('company') || searchParams.get('title') || ''
    if (defaultInputValue) {
      setSearchValue(defaultInputValue)
    }
  }, [searchParams, setSearchValue])

  const handleSearch = useDebouncedCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchValue(value)
      const params = new URLSearchParams(searchParams)
      params.delete('title')
      params.delete('company')
      if (value) {
        params.set(searchType, value)
      }
      replace(`${pathname}?${params.toString()}`)
    },
    500,
  )

  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-8 -translate-y-1/2 w-20 h-20" />
      <input
        type="text"
        name="search"
        className={`min-w-264 h-40 pl-28 placeholder:text-neutral-subtext ${styles.outline}`}
        placeholder={`search ${searchType}`}
        onChange={handleSearch}
        defaultValue={defaultInputValue}
      />
    </div>
  )
}
