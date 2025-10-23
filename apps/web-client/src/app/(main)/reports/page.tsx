import ReportSelect from './_components/ReportSelect'

export default function ReportsPage() {
  return (
    <article>
      <ReportSelect name="search_section" defaultValue={'title'}>
        <option value="title">title</option>
        <option value="company">company</option>
      </ReportSelect>
    </article>
  )
}
