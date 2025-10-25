import styles from './header.module.css'
import Popover from './popover/Popover'
import PopoverContent from './popover/PopoverContent'
import PopoverTriggerButton from './popover/PopoverTriggerButton'
import ReportSelect from './ReportSelect'

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
        <label htmlFor="job" className={styles.labelText}>
          job
          <ReportSelect
            id="job"
            name="job"
            defaultValue={'total'}
            className="w-120"
          >
            <option value="total">total</option>
            <option value="web">Web developer</option>
            <option value="app">App developer</option>
          </ReportSelect>
        </label>
        <label htmlFor="detailJob" className={styles.labelText}>
          detail job
          <ReportSelect id="detailJob" name="detailJob" defaultValue={'total'}>
            <option value="total">total</option>
            <option value="front">Frontend</option>
            <option value="back">Backend</option>
          </ReportSelect>
        </label>
      </PopoverContent>
    </Popover>
  )
}
