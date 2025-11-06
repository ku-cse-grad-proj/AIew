import CardSection from './CardSection'
import styles from './dashboard.module.css'
import EmptyInterview from './EmptyInterview'
import InterviewCard from './InterviewCard'
import ShortcutLink from './ShortcutLink'

export default function RecentInterview({
  interview,
  className,
}: {
  interview: Interview
  className?: string
}) {
  const hasInterview = true

  return (
    <CardSection
      className={`p-16 h-full flex flex-col gap-8 relative ${className}`}
    >
      <h3 className={`${styles.sectionHeading}`}>recent interview</h3>
      <ShortcutLink
        href="/interview"
        className="bg-neutral-gray absolute right-12 top-12"
      />

      {hasInterview ? (
        <InterviewCard interview={interview} />
      ) : (
        <EmptyInterview />
      )}
    </CardSection>
  )
}
