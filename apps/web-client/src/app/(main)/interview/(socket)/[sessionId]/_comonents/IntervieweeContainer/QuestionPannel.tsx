import IntervieweeSection from './IntervieweeSection'

export default function QuestionPannel({
  className,
  onClick,
}: {
  className?: string
  onClick: () => void
}) {
  return (
    <IntervieweeSection className={className}>
      <button type="button" onClick={onClick}>
        back
      </button>
      <ul>
        <li>Question 1</li>
        <li>Question 2</li>
        <li>Question 3</li>
        <li>Question 4</li>
        <li>Question 5</li>
      </ul>
    </IntervieweeSection>
  )
}
