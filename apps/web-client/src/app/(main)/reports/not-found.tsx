import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

export default function NotFound() {
  return (
    <div className="w-full min-h-0 flex-1 flex flex-col items-center justify-center gap-24">
      해당하는 report를 찾을 수 없습니다.
      <ButtonLink href={'/reports'}>back to Reports</ButtonLink>
    </div>
  )
}
