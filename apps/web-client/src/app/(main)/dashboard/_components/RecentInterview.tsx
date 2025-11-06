import CardSection from '../CardSection'

import EmptyInterview from './EmptyInterview'
import InterviewCard from './InterviewCard'
import ShortcutLink from './ShortcutLink'

export default function RecentInterview({ className }: { className?: string }) {
  const hasInterview = true
  const interview = {
    status: 'READY',
    title: '배달의 민족 interview',
    company: '배달의 민족',
    jobTitle: 'web',
    jobSpec: 'front',
  } as Interview
  return (
    <CardSection
      className={`p-16 h-full flex flex-col gap-8 relative ${className}`}
    >
      <h3 className="text-[24px] font-medium shrink-0">recent interview</h3>
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
