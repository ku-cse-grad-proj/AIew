export default function InterviewStatusChip({
  status,
}: {
  status: InterviewStatus
}) {
  const STATUS_STYLES = {
    PENDING: 'bg-warning',
    READY: 'bg-success',
    FAILED: 'bg-error',
    IN_PROGRESS: 'bg-neutral-subtext',
    COMPLETED: 'bg-neutral-subtext',
  }
  return (
    <div
      className={`w-96 h-32 flex justify-center items-center rounded-full text-neutral-inverse ${STATUS_STYLES[status]}`}
    >
      {status.toLowerCase()}
    </div>
  )
}
