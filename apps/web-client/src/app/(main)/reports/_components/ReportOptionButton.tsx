'use client'

import { usePathname, useRouter } from 'next/navigation'

import PopoverContent from '../../_components/popover/PopoverContent'

import Delete from '@/../public/icons/delete.svg'
import Dots from '@/../public/icons/dots.svg'
import Popover, { usePopover } from '@/app/(main)/_components/popover/Popover'
import PopoverTriggerButton from '@/app/(main)/_components/popover/PopoverTriggerButton'
import { useReportActions } from '@/app/hooks/ReportActionsContext'

export default function ReportOptionButton({
  contentPosition,
  id,
}: {
  contentPosition?: 'top-right' | 'bottom-right'
  id: string
}) {
  return (
    <Popover>
      <PopoverTriggerButton className="flex justify-center items-center">
        <Dots width={20} height={20} />
      </PopoverTriggerButton>
      <PopoverContent
        showCloseButton={false}
        className={`absolute bg-neutral-card shadow-box px-16 py-8 z-100 rounded-[10px]
            ${contentPosition === 'top-right' ? 'right-0 bottom-full' : 'right-0 top-full'}`}
      >
        <DeleteReportButton id={id} />
      </PopoverContent>
    </Popover>
  )
}

//PopoverContext의 usePopover를 사용하기 위해 별도 컴포넌트로 분리
function DeleteReportButton({ id }: { id: string }) {
  const { removeReport } = useReportActions()
  const { setIsOpen } = usePopover()
  const router = useRouter()
  const pathname = usePathname()

  //reports 뒤에 하위 경로가 있는지 확인해 상세 report 페이지인지 판단
  const hasReportId = pathname.startsWith('/reports/')

  const handleClick = async () => {
    setIsOpen(false)
    if (!confirm('report를 삭제하시겠습니까?')) return
    await removeReport(id)
    if (hasReportId) {
      //상세 페이지 내부에서의 router 이동은 모두 replace로 처리함
      //이에 back으로 돌아가면 searchParams가 유지된 상태의 목록 페이지로 돌아가게 됨
      router.back()
    }
  }

  return (
    <button className="flex gap-8 items-center" onClick={handleClick}>
      <Delete width={16} height={16} />
      <span className="text-error">delete</span>
    </button>
  )
}
