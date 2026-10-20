import { motion } from 'motion/react'
import { useState } from 'react'

export interface BarDatum {
  label: string
  value: number
  color: string
}

interface StatusBarChartProps {
  data: BarDatum[]
}

const BAR_HEIGHT = 22
const GAP = 10
const LABEL_WIDTH = 132

// Light bars (the early pipeline greys) need dark value labels; dark bars need white.
function contrastText(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luminance > 0.6 ? '#0c0f0d' : '#ffffff'
}

/** Horizontal bar chart: one bar per status, rounded data-end, hover tooltip, direct value label. */
export function StatusBarChart({ data }: StatusBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const width = 420
  const chartWidth = width - LABEL_WIDTH
  const height = data.length * (BAR_HEIGHT + GAP)

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Applications by status">
        {data.map((d, i) => {
          const barWidth = Math.max(4, (d.value / max) * (chartWidth - 40))
          const y = i * (BAR_HEIGHT + GAP)
          const isHovered = hovered === i
          const labelFits = barWidth > 28
          return (
            <g key={d.label}>
              <text
                x={LABEL_WIDTH - 10}
                y={y + BAR_HEIGHT / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted"
                style={{ fontSize: 11 }}
              >
                {d.label}
              </text>
              <rect
                x={LABEL_WIDTH}
                y={y}
                width={chartWidth - 40}
                height={BAR_HEIGHT}
                rx={4}
                className="fill-subtle"
              />
              <motion.rect
                x={LABEL_WIDTH}
                y={y}
                initial={{ width: 0 }}
                animate={{ width: barWidth }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                height={BAR_HEIGHT}
                rx={4}
                fill={d.color}
                opacity={hovered === null || isHovered ? 1 : 0.55}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              >
                <title>
                  {d.label}: {d.value}
                </title>
              </motion.rect>
              {labelFits ? (
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  x={LABEL_WIDTH + barWidth - 8}
                  y={y + BAR_HEIGHT / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={contrastText(d.color)}
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {d.value}
                </motion.text>
              ) : (
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  x={LABEL_WIDTH + barWidth + 8}
                  y={y + BAR_HEIGHT / 2}
                  dominantBaseline="middle"
                  className="fill-ink-soft"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {d.value}
                </motion.text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
