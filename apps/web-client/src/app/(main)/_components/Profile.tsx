import Image from 'next/image'

import { getUser } from '../_lib/api'

import Popover from './popover/Popover'
import PopoverContent from './popover/PopoverContent'
import PopoverTriggeButton from './popover/PopoverTriggerButton'

//TODO:: logout시 cache 파기
export default async function Profile() {
  const me = await getUser()

  return (
    <Popover>
      <PopoverTriggeButton>
        <Image
          className="justify-self-end rounded-full"
          src={me.pic_url}
          alt="profile img"
          width={48}
          height={48}
        />
      </PopoverTriggeButton>
      <PopoverContent className="right-0 w-320 h-320 bg-neutral-card z-100 shadow-box rounded-[20px]"></PopoverContent>
    </Popover>
  )
}
