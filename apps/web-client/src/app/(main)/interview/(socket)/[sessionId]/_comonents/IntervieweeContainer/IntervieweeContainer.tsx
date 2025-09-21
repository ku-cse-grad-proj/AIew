import { HTMLProps } from 'react'

import IntervieweePannel from './IntervieweePannel'

export default function IntervieweeContainer({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      <IntervieweePannel />
    </div>
  )
}
