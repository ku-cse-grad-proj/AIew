import Popover from '../../../_components/popover/Popover'
import PopoverContent from '../../../_components/popover/PopoverContent'
import PopoverTriggerButton from '../../../_components/popover/PopoverTriggerButton'

import styles from './header.module.css'
import ReportDetailJobSelect from './ReportDetailJobSelect'
import ReportJobSelect from './ReportJobSelect'

import Filter from '@/../public/icons/filter.svg'

export default function ReportFilterButton() {
  return (
    <Popover>
      <PopoverTriggerButton
        className={`inline-flex h-40 items-center px-10 gap-4 ${styles.outline}`}
      >
        <Filter width={20} height={20} />
        <span>filter</span>
      </PopoverTriggerButton>

      <PopoverContent className={`min-w-150 ${styles.popoverContent}`}>
        <ReportJobSelect />
        <ReportDetailJobSelect />
      </PopoverContent>
    </Popover>
  )
}
