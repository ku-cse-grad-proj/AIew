'use client'

import { useState } from 'react'

import { MetricsInfo } from '../_types'

import MetricCard from './MetricCard'

import Cancel from '@/../public/icons/cancel.svg'
import { extractDate, formatDateTime } from '@/app/lib/util'

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
      <MetricCard
        onClick={() => setShowDetail('score')}
        inert={isDetailOpen}
        className="flex flex-col justify-center items-center gap-4"
        title="avg score"
        content={`${metricsInfo.score}`}
      />
      <MetricCard
        onClick={() => setShowDetail('duration')}
        inert={isDetailOpen}
        title="duration"
        content={`${metricsInfo.duration} min`}
      />
      <MetricCard
        onClick={() => setShowDetail('count')}
        inert={isDetailOpen}
        title="questions count"
        content={`${metricsInfo.count}`}
      />
      <MetricCard
        onClick={() => setShowDetail('date')}
        inert={isDetailOpen}
        title="date"
        content={extractDate(metricsInfo.finishDate)}
      />

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
        {showDetail === 'score' && <ScoreDetail scores={metricsInfo.scores} />}
        {showDetail === 'duration' && (
          <DurationDetail durations={metricsInfo.durations} />
        )}
        {showDetail === 'count' && <CountDetail counts={metricsInfo.counts} />}
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

function ScoreDetail({ scores }: { scores: number[] }) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[20px] text-medium">avg score</h3>
      <dl className="flex-1 min-h-0 flex flex-col gap-2 pt-16">
        <div className="flex-1 flex flex-col">
          <dt className="">total avg score</dt>
          <dd className="flex-1 min-h-0 text-[20px]">3.4</dd>
        </div>
        {scores.map((score, i) => (
          <div key={i} className="flex justify-between">
            <dt className="text-neutral-subtext">{`question ${i + 1} avg`}</dt>
            <dd className="font-medium">{score}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function DurationDetail({ durations }: { durations: number[] }) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[20px] text-medium">duration</h3>
      <dl className="flex-1 min-h-0 flex flex-col gap-2 pt-16">
        <div className="flex-1 flex flex-col">
          <dt className="">total duration</dt>
          <dd className="flex-1 min-h-0 text-[20px]">58 min</dd>
        </div>
        {durations.map((duration, i) => (
          <div key={i} className="flex justify-between">
            <dt className="text-neutral-subtext">{`question ${i + 1}`}</dt>
            <dd className="font-medium">{duration} min</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function CountDetail({ counts }: { counts: number[] }) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[20px] text-medium">question count</h3>
      <dl className="flex-1 min-h-0 flex flex-col gap-2 pt-16">
        <div className="flex-1 flex flex-col">
          <dt className="">total count</dt>
          <dd className="flex-1 min-h-0 text-[20px]">15</dd>
        </div>
        {counts.map((count, i) => (
          <div key={i} className="flex justify-between">
            <dt className="text-neutral-subtext">{`question ${i + 1}`}</dt>
            <dd className="font-medium">{count}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function DateDetail({
  startDate,
  finishDate,
}: {
  startDate: string
  finishDate: string
}) {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[20px] text-medium">date</h3>
      <dl className="flex-1 min-h-0 flex flex-col gap-2 pt-16">
        <div className="flex-1 flex flex-col">
          <dt className="">start date</dt>
          <dd className="flex-1 min-h-0 text-[20px] font-mono">
            {formatDateTime(startDate)}
          </dd>
        </div>
        <div className="flex-1 flex flex-col">
          <dt className="">finish date</dt>
          <dd className="flex-1 min-h-0 text-[20px] font-mono">
            {formatDateTime(finishDate)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
