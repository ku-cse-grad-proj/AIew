'use client'

import { ButtonHTMLAttributes } from 'react'

import { usePopover } from './Popover'

export default function PopoverTriggeButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const { isOpen, setIsOpen } = usePopover()
  return (
    <button
      {...props}
      aria-haspopup="dialog"
      onClick={() => setIsOpen(!isOpen)}
    >
      {props.children}
    </button>
  )
}
