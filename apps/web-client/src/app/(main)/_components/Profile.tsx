import { getUser } from '../_lib/api'

import Popover from './popover/Popover'
import PopoverContent from './popover/PopoverContent'
import PopoverTriggeButton from './popover/PopoverTriggerButton'
import ProfileMenuPopover from './ProfileMenuPopover'

import CircleProfile from '@/app/_components/CircleProfile'

export default async function Profile() {
  const me = await getUser()

  return (
    <Popover>
      <PopoverTriggeButton>
        <CircleProfile
          width={48}
          height={48}
          src={me.pic_url}
          name={me.name}
          updatedAt={me.updatedAt}
          className="justify-self-end"
        />
      </PopoverTriggeButton>
      <PopoverContent className="right-0 w-320 h-320 bg-neutral-card z-100 shadow-box rounded-[20px]">
        <ProfileMenuPopover />
      </PopoverContent>
    </Popover>
  )
}
