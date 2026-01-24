import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

export default function NotFound() {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-24">
      sessionId에 해당하는 interview를 찾을 수 없습니다.
      <ButtonLink href={'/interview'}>back to Interview</ButtonLink>
    </div>
  )
}
