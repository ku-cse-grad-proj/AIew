'use client'

import { LogOut } from 'lucide-react'

import { handleSignOut } from '../_lib/action'

import { usePopover } from './popover/Popover'

export default function SignOutButton() {
  const { setIsOpen } = usePopover()

  const handleClick = () => {
    setIsOpen(false)
    handleSignOut()
  }
  return (
    <button
      className="text-error border border-error w-full py-8 inline-flex gap-8 items-center justify-center rounded-[10px]"
      type="button"
      onClick={handleClick}
    >
      <LogOut width={16} height={16} />
      <span className="text-error">sign out</span>
    </button>
  )
}
