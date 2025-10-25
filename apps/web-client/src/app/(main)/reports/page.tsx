import ReportCalendarButton from './_components/header/ReportCalendarButton'
import ReportFilterButton from './_components/header/ReportFilterButton'
import ReportSearchInput from './_components/header/ReportSearchInput'
import ReportSelect from './_components/header/ReportSelect'

export default function ReportsPage() {
  return (
    <article>
      <div className="flex justify-between">
        <div className="flex gap-8">
          <ReportSelect
            name="search_section"
            defaultValue={'title'}
            className="min-w-120"
          >
            <option value="title">title</option>
            <option value="company">company</option>
          </ReportSelect>
          <ReportSearchInput />
        </div>
        <div className="flex gap-8">
          <ReportCalendarButton />
          <ReportFilterButton />
        </div>
      </div>
    </article>
  )
}
