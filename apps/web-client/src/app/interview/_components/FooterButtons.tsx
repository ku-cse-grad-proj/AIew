'use client'
import { useRouter } from 'next/navigation'

export default function FooterButtons({
  isWaiting = false,
  onClick,
}: {
  isWaiting?: boolean
  onClick?: () => void
}) {
  const router = useRouter()
  return (
    <div className="w-full h-48 flex gap-24 flex-none">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex-3 rounded-[10px] border border-dark text-dark hover:shadow-md hover:cursor-pointer"
      >
        back
      </button>
      <button
        type={isWaiting ? 'button' : 'submit'}
        disabled={isWaiting}
        onClick={onClick}
        className="flex-7 rounded-[10px] bg-navy text-bright hover:shadow-xl hover:cursor-pointer"
      >
        {isWaiting ? 'start interview' : 'create interview'}
      </button>
    </div>
  )
}
