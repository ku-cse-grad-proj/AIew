'use client'
import { useRouter } from 'next/navigation'

export default function FooterButtons({
  isEdit = false,
  isWaiting = false,
  onClick,
  isQuestionsReady = false,
  destroySocket,
}: {
  isEdit?: boolean
  isWaiting?: boolean
  onClick?: () => void
  isQuestionsReady?: boolean
  destroySocket?: () => void
}) {
  const router = useRouter()

  function handleBackButton() {
    destroySocket?.()
    router.push('/interview')
  }

  return (
    <div className="w-full h-48 flex gap-24 flex-none">
      <button
        type="button"
        onClick={handleBackButton}
        className="flex-3 rounded-[10px] border border-neutral-subtext text-neutral-subtext hover:shadow-md hover:cursor-pointer"
      >
        back
      </button>
      <button
        type={isWaiting ? 'button' : 'submit'}
        disabled={isWaiting && !isQuestionsReady}
        onClick={onClick}
        className="flex-7 rounded-[10px] bg-primary text-neutral-inverse hover:shadow-xl hover:cursor-pointer
        disabled:hover:shadow-none disabled:opacity-50
    disabled:cursor-not-allowed"
      >
        {isWaiting
          ? 'start interview'
          : isEdit
            ? 'edit interview'
            : 'create interview'}
      </button>
    </div>
  )
}
