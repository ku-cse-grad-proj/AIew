'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type mode = 'create' | 'edit' | 'waiting'

export default function FooterButtons({
  mode,
  isQuestionsReady = false,
}: {
  mode: mode
  isQuestionsReady?: boolean
}) {
  const router = useRouter()
  const params = useParams<{ sessionId?: string }>()

  async function handleBackButton() {
    router.push('/interview')
  }

  const rightButtonStyle =
    'flex-7 rounded-[10px] bg-primary text-neutral-inverse hover:shadow-xl hover:cursor-pointer'

  return (
    <div className="w-full h-48 flex gap-24 flex-none">
      <button
        type="button"
        onClick={handleBackButton}
        className="flex-3 rounded-[10px] border border-neutral-subtext text-neutral-subtext hover:shadow-md hover:cursor-pointer"
      >
        back
      </button>
      {mode === 'waiting' ? (
        <Link
          href={`/interview/${params?.sessionId}`}
          className={`${rightButtonStyle} inline-flex items-center justify-center ${!isQuestionsReady && 'pointer-events-none opacity-50'}`}
        >
          start interview
        </Link>
      ) : (
        <button type="submit" className={rightButtonStyle}>
          {mode == 'create' ? 'create interview' : 'edit interview'}
        </button>
      )}
    </div>
  )
}
