'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import Graph from '@/../public/icons/graph.svg'
import List from '@/../public/icons/list.svg'
import { ButtonLink } from '@/components/ButtonLink/ButtonLink'

export default function ToggleButton() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const paramsString = searchParams.toString()
  const hasGraph = pathname.includes('/reports/graph')

  const nextHref = hasGraph
    ? `/reports${paramsString ? `?${paramsString}` : ''}`
    : `/reports/graph${paramsString ? `?${paramsString}` : ''}`

  return (
    <ButtonLink href={nextHref} className="min-w-152">
      {hasGraph ? (
        <span className="inline-flex justify-center items-center gap-8">
          <List width={20} height={20} />
          <span>show list</span>
        </span>
      ) : (
        <span className="inline-flex justify-center items-center gap-8">
          <Graph width={20} height={20} />
          <span>show graph</span>
        </span>
      )}
    </ButtonLink>
  )
}
