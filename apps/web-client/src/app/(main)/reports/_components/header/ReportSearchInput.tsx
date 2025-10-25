import styles from './header.module.css'

import Search from '@/../public/icons/search.svg'

export default function ReportSearchInput() {
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-8 -translate-y-1/2 w-20 h-20" />
      <input
        type="text"
        name="search"
        className={`min-w-264 h-40 pl-28 placeholder:text-neutral-subtext ${styles.outline}`}
        placeholder="search"
      />
    </div>
  )
}
