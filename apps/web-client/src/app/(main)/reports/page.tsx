import ReportCalendarButton from './_components/ReportCalendarButton'
import ReportSearchInput from './_components/ReportSearchInput'
import ReportSelect from './_components/ReportSelect'

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
