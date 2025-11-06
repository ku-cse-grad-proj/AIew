import { ReactNode } from 'react'

import styles from './dashboard.module.css'

export default function CardSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`w-full h-full bg-neutral-card ${className} ${styles.card} `}
    >
      {children}
    </section>
  )
}
