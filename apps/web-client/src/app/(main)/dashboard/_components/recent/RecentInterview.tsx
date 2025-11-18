import { getDashboard } from '../../_lib/api'
import CardSection from '../CardSection'
import styles from '../dashboard.module.css'
import ShortcutLink from '../ShortcutLink'

import EmptyInterview from './EmptyInterview'
import InterviewCard from './InterviewCard'

export default async function RecentInterview({
  className,
}: {
  className?: string
}) {
  let { interview }: { interview: Interview } = await getDashboard()

  return (
    <CardSection
      className={`p-16 h-full flex flex-col gap-8 relative ${className}`}
    >
      <h3 className={`${styles.sectionHeading}`}>recent interview</h3>
      <ShortcutLink
        href="/interview"
        className="bg-neutral-gray absolute right-12 top-12"
      />

      {interview.id ? (
        <InterviewCard interview={interview} />
      ) : (
        <EmptyInterview />
      )}
    </CardSection>
  )
}
