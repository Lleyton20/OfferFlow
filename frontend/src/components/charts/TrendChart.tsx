import { useState } from 'react'

export interface TrendPoint {
  label: string
  value: number
}

interface TrendChartProps {
  data: TrendPoint[]
  color: string
  valueSuffix?: string
  ariaLabel: string
}

const WIDTH = 480
const HEIGHT = 160
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 }

/** Single-series line chart: 2px line, >=8px end dots, per-point hover tooltip. */
export function TrendChart({ data, color, valueSuffix = '', ariaLabel }: TrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Not enough data yet.</p>
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom
  const max = Math.max(...data.map((d) => d.value), 1)
  const min = Math.min(...data.map((d) => d.value), 0)
  const range = max - min || 1

  const points = data.map((d, i) => ({
    ...d,
    x: PADDING.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth),
    y: PADDING.top + innerHeight - ((d.value - min) / range) * innerHeight,
  }))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x} ${PADDING.top + innerHeight} L ${points[0].x} ${PADDING.top + innerHeight} Z`

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel}>
        <line
          x1={PADDING.left}
          y1={PADDING.top + innerHeight}
          x2={WIDTH - PADDING.right}
          y2={PADDING.top + innerHeight}
          stroke="currentColor"
          className="text-slate-800"
          strokeWidth={1}
        />
        <path d={areaPath} fill={color} opacity={0.1} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill={color}
              stroke="#05060a"
              strokeWidth={2}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            >
              <title>
                {p.label}: {p.value}
                {valueSuffix}
              </title>
            </circle>
            <text
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-slate-500"
              style={{ fontSize: 9 }}
            >
              {p.label}
            </text>
          </g>
        ))}
        {hovered !== null && (
          <text
            x={points[hovered].x}
            y={points[hovered].y - 12}
            textAnchor="middle"
            className="fill-white"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {points[hovered].value}
            {valueSuffix}
          </text>
        )}
      </svg>
    </div>
  )
}
