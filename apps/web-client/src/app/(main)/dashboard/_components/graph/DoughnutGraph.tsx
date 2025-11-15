'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

/**
 * 회사별 인터뷰 횟수를 시각화하는 도넛 그래프 컴포넌트입니다.
 *
 * Chart.js의 Doughnut 차트를 사용하며, 각 회사의 비율과 총합 대비
 * 백분율을 함께 표시합니다.
 *
 * @component
 * @example
 * ```tsx
 * <DoughnutGraph
 *   data={[
 *     ['배달의민족', '카카오', '쿠팡', '네이버', '토스', 'Others'],
 *     [4, 3, 2, 2, 1, 2],
 *   ]}
 * />
 * ```
 *
 * @param {object} props - 컴포넌트 속성
 * @param {[string[], number[]]} props.data
 *   그래프 데이터로, `[labels, counts]` 형태의 배열입니다.
 *   - `labels`: 각 섹션(회사명) 이름 배열
 *   - `counts`: 각 회사의 인터뷰 횟수 배열 (labels와 길이가 동일해야 함)
 *
 * @returns 인터뷰 비율을 시각화한 도넛 그래프 컴포넌트
 */

export default function DoughnutGraph({
  data,
}: {
  data: [string[], number[]]
}) {
  if (!data || data.length !== 2) {
    throw new Error(
      'LineGraph data는 [labels, counts] 형태의 2개 배열이어야 합니다.',
    )
  }

  const [labels, counts] = data
  const isSameLength = labels.length === counts.length

  if (!isSameLength) {
    throw new Error(
      `DoughnuGraph data의 배열의 길이가 동일해야 합니다. 
    (labels: ${labels.length}, counts: ${counts.length})`,
    )
  }

  const total = data[1].reduce((a, b) => a + b, 0)

  const palette = [
    '#4caf50',
    '#3A76A2',
    '#f44336',
    '#ffc107',
    '#333d71',
    '#d1d5dc',
  ]

  const graphData: ChartData<'doughnut'> = {
    labels: data[0],
    datasets: [
      {
        data: data[1],
        backgroundColor: data[0].map((_, i) => palette[i % palette.length]),
        borderWidth: 0,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    layout: { padding: 8 },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          usePointStyle: true,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed
            const pct = total ? ((v / total) * 100).toFixed(1) : '0.0'
            return `${ctx.label}: ${v}번 (${pct}%)`
          },
        },
      },
    },
  }

  return <Doughnut data={graphData} options={options} />
}
