'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import Graph from '@/../public/icons/graph.svg'
import List from '@/../public/icons/list.svg'

export default function ToggleButton() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const paramsString = searchParams.toString()
  const hasGraph = pathname.includes('/reports/graph')

  const nextHref = hasGraph
    ? `/reports${paramsString ? `?${paramsString}` : ''}`
    : `/reports/graph${paramsString ? `?${paramsString}` : ''}`

  return (
    <Link
      href={nextHref}
      className="bg-primary inline-flex justify-center items-center px-16 rounded-[10px] min-w-150 h-40 gap-8 text-neutral-background"
    >
      {hasGraph ? (
        <>
          <List width={20} height={20} />
          <span className="text-neutral-background">show list</span>
        </>
      ) : (
        <>
          <Graph width={20} height={20} />
          <span className="text-neutral-background">show graph</span>
        </>
      )}
    </Link>
  )
}
