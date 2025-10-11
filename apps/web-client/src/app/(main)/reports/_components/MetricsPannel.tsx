'use client'

import { useState } from 'react'

import { MetricsInfo } from '../_types'

import MetricButton from './MetricButton'
import {
  CountDetail,
  DateDetail,
  DurationDetail,
  ScoreDetail,
} from './MetricDetailContents'

import Cancel from '@/../public/icons/cancel.svg'
import { extractDate } from '@/app/lib/util'

type mode = 'score' | 'duration' | 'date' | 'count' | null

export default function MetricsPannel({
  className,
  metricsInfo,
}: {
  className?: string
  metricsInfo: MetricsInfo
}) {
  const [showDetail, setShowDetail] = useState<mode>(null)

  const isDetailOpen = showDetail !== null

  return (
    <div
      className={`grid grid-rows-2 grid-cols-2 gap-24 relative ${className}`}
    >
      {/* score */}
      <MetricButton
        onClick={() => setShowDetail('score')}
        inert={isDetailOpen}
        className="flex flex-col justify-center items-center gap-4"
        title="avg score"
        content={`${metricsInfo.score}`}
      />
      {/* duration */}
      <MetricButton
        onClick={() => setShowDetail('duration')}
        inert={isDetailOpen}
        title="duration"
        content={`${metricsInfo.duration} min`}
      />
      {/* count */}
      <MetricButton
        onClick={() => setShowDetail('count')}
        inert={isDetailOpen}
        title="questions count"
        content={`${metricsInfo.count}`}
      />
      {/* date */}
      <MetricButton
        onClick={() => setShowDetail('date')}
        inert={isDetailOpen}
        title="date"
        content={extractDate(metricsInfo.finishDate)}
      />

      {/* detail(클릭시 나타남) */}
      <div
        className={`absolute inset-0 bg-neutral-background rounded-[10px] p-16 transition-opacity duration-300 ease-in ${
          showDetail ? 'opacity-100' : 'opacity-0'
        }`}
        inert={!isDetailOpen}
      >
        {/* 취소 버튼 */}
        <button
          className="absolute top-16 right-16"
          onClick={() => setShowDetail(null)}
        >
          <Cancel width={20} height={20} />
        </button>

        {/* mode에 따라 나타나는 content가 다름 */}
        {/* score */}
        {showDetail === 'score' && (
          <ScoreDetail scores={metricsInfo.scores} score={metricsInfo.score} />
        )}

        {/* duration */}
        {showDetail === 'duration' && (
          <DurationDetail
            durations={metricsInfo.durations}
            duration={metricsInfo.duration}
          />
        )}

        {/* count */}
        {showDetail === 'count' && (
          <CountDetail counts={metricsInfo.counts} count={metricsInfo.count} />
        )}

        {/* date */}
        {showDetail === 'date' && (
          <DateDetail
            startDate={metricsInfo.startDate}
            finishDate={metricsInfo.finishDate}
          />
        )}
      </div>
    </div>
  )
}
