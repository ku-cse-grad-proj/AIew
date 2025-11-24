import PopoverContent from '../../_components/popover/PopoverContent'

import Delete from '@/../public/icons/delete.svg'
import Dots from '@/../public/icons/dots.svg'
import Popover from '@/app/(main)/_components/popover/Popover'
import PopoverTriggerButton from '@/app/(main)/_components/popover/PopoverTriggerButton'

export default function ReportOptionButton({
  contentPosition,
}: {
  contentPosition?: 'top-right' | 'bottom-right'
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
        <button className="flex gap-8 items-center">
          <Delete width={16} height={16} />
          <span className="text-error">delete</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
