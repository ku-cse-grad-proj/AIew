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
      className="group text-error border border-error w-full py-8 inline-flex gap-8 items-center justify-center rounded-[10px] transition-colors hover:bg-error hover:text-neutral-card"
      type="button"
      onClick={handleClick}
    >
      <LogOut
        width={16}
        height={16}
        className="transition-colors group-hover:text-neutral-card"
      />
      <span className="text-error transition-colors group-hover:text-neutral-card">
        sign out
      </span>
    </button>
  )
}
