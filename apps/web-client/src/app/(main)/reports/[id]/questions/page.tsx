import ResultSection from './_components/InfoSection'
import ListSection from './_components/ListSection'
import InfoSection from './_components/ResultSection'

export default function QuestionsReportPage() {
  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <section
      className={`w-full h-full pt-24 grid grid-cols-[5fr_2fr] grid-rows-[7fr_8fr] gap-24`}
    >
      <InfoSection className={`${cardStyle}`} />
      <ListSection
        className={`col-start-2 row-start-1 row-end-3 ${cardStyle}`}
      />
      <ResultSection className={`${cardStyle}`} />
    </section>
  )
}
