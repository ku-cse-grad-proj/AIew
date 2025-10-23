import { SelectHTMLAttributes } from 'react'

export default function ReportSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>,
) {
  const view = 'w-120 h-40 px-8 border border-gray-300 rounded-[10px]'
  const textDecoration = 'text-neutral-text'
  return (
    <select
      {...props}
      className={`${view} ${textDecoration} ${props.className}`}
    >
      {props.children}
    </select>
  )
}
