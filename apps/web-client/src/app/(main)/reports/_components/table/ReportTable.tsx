import { ReactNode } from 'react'

import styles from './table.module.css'

export default async function ReportTable({
  children,
}: {
  children: ReactNode
}) {
  return (
    <section className={`${styles.table}`}>
      <h3 className="sr-only">reports table</h3>
      {children}
    </section>
  )
}
