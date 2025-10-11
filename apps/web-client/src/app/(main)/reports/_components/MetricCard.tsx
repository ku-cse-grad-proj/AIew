'use client'
import { ButtonHTMLAttributes } from 'react'

interface MetricCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string
  content?: string
}

export default function MetricCard({
  title,
  content,
  className,
  ...props
}: MetricCardProps) {
  const cardStyle =
    'w-full h-full rounded-[10px] bg-neutral-background transition-all transition-shadow duration-300 ease-in-out hover:shadow-box hover:scale-[1.03]'
  return (
    <button
      {...props}
      className={`flex flex-col justify-center items-center gap-4 ${cardStyle} ${className ?? ''}`}
    >
      <span className="text-neutral-subtext">{title}</span>
      <strong className="font-medium text-[18px]">{content}</strong>
      {props.children}
    </button>
  )
}
