import Search from '@/../public/icons/search.svg'

export default function ReportSearchInput() {
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-8 -translate-y-1/2 w-20 h-20" />
      <input
        type="text"
        name="search"
        className="min-w-264 h-40 pl-28 border border-1 border-neutral-gray rounded-[10px] placeholder:text-neutral-subtext"
        placeholder="search"
      />
    </div>
  )
}
