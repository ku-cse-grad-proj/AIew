'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

type EmotionKey = 'angry' | 'fear' | 'happy' | 'neutral' | 'sad' | 'surprise'

/**
 * 초 단위로 수집된 감정(angry, fear, happy, neutral, sad, surprise) 값을
 * 선 그래프로 시각화하는 컴포넌트입니다.
 *
 * 각 감정 값은 일반적으로 0~1 범위(확률 또는 score)를 가정합니다.
 *
 * @example
 * ```tsx
 * <EmotionGraph
 *   data={{
 *     times: ['0s', '1s', '2s', '3s'],
 *     angry:    [0.1, 0.2, 0.05, 0.0],
 *     fear:     [0.0, 0.1, 0.2,  0.3],
 *     happy:    [0.4, 0.3, 0.5,  0.6],
 *     neutral:  [0.4, 0.3, 0.2,  0.1],
 *     sad:      [0.0, 0.1, 0.05, 0.0],
 *     surprise: [0.1, 0.0, 0.0,  0.0],
 *   }}
 * />
 * ```
 */

export interface EmotionGraphData {
  times: (string | number)[]
  angry: number[]
  fear: number[]
  happy: number[]
  neutral: number[]
  sad: number[]
  surprise: number[]
}

interface EmotionGraphProps {
  data: EmotionGraphData
}

const emotionColors: Record<EmotionKey, string> = {
  angry: '#e74c3c', // red
  fear: '#9b59b6', // purple
  happy: '#f1c40f', // yellow
  neutral: '#95a5a6', // gray
  sad: '#3498db', // blue
  surprise: '#2ecc71', // green
}

const baseOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top' },
    title: { display: false, text: '' },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const label = `${ctx.dataset.label} s`
          const value = ctx.parsed.y ?? 0
          // 0~1 값을 퍼센트로 표시 (0~100으로 들어오면 아래를 바꿔도 됨)
          const percent = (value * 100).toFixed(1)
          return `${label}: ${percent}%`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { autoSkip: true, maxRotation: 0, padding: 6, font: { size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      min: 0,
      max: 1,
      ticks: {
        stepSize: 0.2,
        callback: (value) => `${Number(value) * 100}%`,
      },
      title: { display: true, text: 'Probability' },
      grid: { display: false },
      border: { display: false },
    },
  },
}

export default function EmotionGraph({ data }: EmotionGraphProps) {
  if (!data) {
    throw new Error('EmotionGraph data가 필요합니다.')
  }

  const { times, angry, fear, happy, neutral, sad, surprise } = data

  const series: Record<EmotionKey, number[]> = {
    angry,
    fear,
    happy,
    neutral,
    sad,
    surprise,
  }

  // 모든 배열 길이 검증
  const lengths = [
    times.length,
    angry.length,
    fear.length,
    happy.length,
    neutral.length,
    sad.length,
    surprise.length,
  ]
  const allSameLength = lengths.every((len) => len === lengths[0])

  if (!allSameLength) {
    throw new Error(
      `EmotionGraph data의 배열 길이가 모두 동일해야 합니다.
(labels: ${times.length}, angry: ${angry.length}, fear: ${fear.length}, happy: ${happy.length},
 neutral: ${neutral.length}, sad: ${sad.length}, surprise: ${surprise.length})`,
    )
  }

  // 옵션들을 복사해서 사용
  // data의 값이 변경될 때마다 해당 값을 반영한 chart가 생성되도록 함
  const chartData: ChartData<'line'> = {
    labels: times.map((t) => `${t}s`),
    datasets: (Object.keys(series) as EmotionKey[]).map((emotion) => ({
      label: emotion,
      data: series[emotion],
      borderColor: emotionColors[emotion],
      backgroundColor: emotionColors[emotion],
      pointRadius: 2,
      tension: 0.3,
    })),
  }

  const options: ChartOptions<'line'> = {
    ...baseOptions,
  }

  return <Line options={options} data={chartData} />
}
