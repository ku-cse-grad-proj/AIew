import ReportCalendarButton from './_components/header/ReportCalendarButton'
import ReportSearchInput from './_components/header/ReportSearchInput'
import ReportSelect from './_components/header/ReportSelect'

export default function ReportsPage() {
  return (
    <article>
      <div className="flex justify-between">
        <div className="flex gap-8">
          <ReportSelect name="search_section" defaultValue={'title'}>
            <option value="title">title</option>
            <option value="company">company</option>
          </ReportSelect>
          <ReportSearchInput />
        </div>
        <ReportCalendarButton />
      </div>
    </article>
  )
}
