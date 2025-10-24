import ReportSearchInput from './_components/ReportSearchInput'
import ReportSelect from './_components/ReportSelect'

export default function ReportsPage() {
  return (
    <article>
      <div className="flex gap-8">
        <ReportSelect name="search_section" defaultValue={'title'}>
          <option value="title">title</option>
          <option value="company">company</option>
        </ReportSelect>
        <ReportSearchInput />
      </div>
    </article>
  )
}
