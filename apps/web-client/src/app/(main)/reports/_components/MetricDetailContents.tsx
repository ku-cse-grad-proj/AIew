import MetricDetail, { DetailDLItem, DetailDLQuestions } from './MetricDetail'

import { formatDateTime } from '@/app/lib/util'

export function ScoreDetail({
  score,
  scores,
}: {
  score: number
  scores: number[]
}) {
  return (
    <MetricDetail title={'avg score'}>
      <DetailDLItem title={'total avg score'} content={`${score}`} />
      <DetailDLQuestions list={scores} suffix="avg" />
    </MetricDetail>
  )
}

export function DurationDetail({
  duration,
  durations,
}: {
  duration: number
  durations: number[]
}) {
  return (
    <MetricDetail title={'duration'}>
      <DetailDLItem title={'total duration'} content={`${duration} min`} />
      <DetailDLQuestions list={durations} unit="min" />
    </MetricDetail>
  )
}

export function CountDetail({
  count,
  counts,
}: {
  count: number
  counts: number[]
}) {
  return (
    <MetricDetail title={'question count'}>
      <DetailDLItem title={'total count'} content={`${count}`} />
      <DetailDLQuestions list={counts} />
    </MetricDetail>
  )
}

export function DateDetail({
  startDate,
  finishDate,
}: {
  startDate: string
  finishDate: string
}) {
  return (
    <MetricDetail title={'date'}>
      <DetailDLItem title={'start date'} content={formatDateTime(startDate)} />
      <DetailDLItem
        title={'finish date'}
        content={formatDateTime(finishDate)}
      />
    </MetricDetail>
  )
}
