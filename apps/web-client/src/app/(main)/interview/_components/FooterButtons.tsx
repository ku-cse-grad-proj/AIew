'use client'
import { useParams, useRouter } from 'next/navigation'

import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

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
        <ButtonLink
          href={`/interview/${params?.sessionId}`}
          disabled={!isQuestionsReady}
          className="flex-7 h-48"
        >
          start interview
        </ButtonLink>
      ) : (
        <button type="submit" className={rightButtonStyle}>
          {mode == 'create' ? 'create interview' : 'edit interview'}
        </button>
      )}
    </div>
  )
}
