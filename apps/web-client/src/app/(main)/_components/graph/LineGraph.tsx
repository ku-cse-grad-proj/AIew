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

// 데이터셋
export const graphData: ChartData<'line'> = {
  labels: [],
  datasets: [
    {
      label: 'score',
      data: [],
      borderColor: '#3A76A2',
      backgroundColor: '#3A76A2',
      pointRadius: 3,
      tension: 0.3, // 곡선
      yAxisID: 'yScore',
    },
    {
      label: 'duration',
      data: [],
      borderColor: '#666666',
      backgroundColor: '#666666',
      pointRadius: 3,
      tension: 0.3, // 곡선
      yAxisID: 'yDuration',
    },
  ],
}

export const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false, // 부모 높이에 맞게
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top' },
    title: { display: false, text: '' },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const dsLabel = ctx.dataset.label || ''
          return dsLabel.includes('duration')
            ? `${dsLabel}: ${ctx.parsed.y} min`
            : `${dsLabel}: ${ctx.parsed.y}`
        },
      },
    },
  },
  scales: {
    x: {
      position: 'bottom',
      ticks: { autoSkip: false, font: { size: 10 }, padding: 10 },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    yScore: {
      type: 'linear',
      position: 'left',
      min: 0,
      max: 5,
      ticks: {
        stepSize: 1,
      },
      title: { display: true, text: 'score' },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    yDuration: {
      type: 'linear',
      position: 'right',
      grid: { display: false },
      border: {
        display: false,
      },
      title: { display: true, text: 'duration' },
    },
  },
}

/**
 * Chart.js를 이용해 점수(score)와 인터뷰 시간(duration) 데이터를
 * 선 그래프로 시각화하는 컴포넌트입니다.
 *
 * @component
 * @example
 * ```tsx
 * <LineGraph
 *   data={[
 *     ['Interview 1', 'Interview 2'],
 *     [4.2, 3.8],  // 점수 배열
 *     [45, 60],    // 소요 시간 배열
 *   ]}
 * />
 * ```
 *
 * @param {object} props - 컴포넌트 속성
 * @param {[string[], number[], number[]]} props.data
 *   - 그래프에 표시할 데이터 배열
 *   - `[labels, scores, durations]` 순서
 *     - `labels`: 인터뷰 제목 배열
 *     - `scores`: 0~5 사이 소수점 점수
 *     - `durations`: 30~70분 사이의 인터뷰 시간
 *
 * @returns Chart.js의 Line 컴포넌트로 렌더링된 그래프
 */

export default function LineGraph({
  data,
}: {
  data: [string[], number[], number[]]
}) {
  if (!data || data.length !== 3) {
    throw new Error(
      'LineGraph data는 [labels, scores, durations] 형태의 3개 배열이어야 합니다.',
    )
  }

  const [labels, scores, durations] = data

  const lengths = [labels.length, scores.length, durations.length]
  const allSameLength = lengths.every((len) => len === lengths[0])

  if (!allSameLength) {
    throw new Error(
      `LineGraph data의 배열의 길이가 동일해야 합니다. 
    (labels: ${labels.length}, scores: ${scores.length}, durations: ${durations.length})`,
    )
  }

  graphData.labels = data[0] //labels 설정
  graphData.datasets[0].data = data[1] //score 값 설정
  graphData.datasets[1].data = data[2] //duration 값 설정
  if (options.scales?.yDuration) {
    //duration의 최대 최소 값 +-1을 y축 기준으로 설정
    options.scales.yDuration.min = Math.min(...data[2]) - 1
    options.scales.yDuration.max = Math.max(...data[2]) + 1
  }
  return <Line options={options} data={graphData} />
}
