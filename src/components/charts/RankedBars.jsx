import { useState } from 'react'
import { useMeasure } from '../../lib/useMeasure'
import { barPath } from './shapes'
import { MARK } from './tokens'
import { Tooltip } from './Tooltip'

const ROW_HEIGHT = 42
const BAR_THICKNESS = 16

export function RankedBars({ items, colors, formatValue, buildTooltip, ariaLabel }) {
  const [ref, width] = useMeasure()
  const [active, setActive] = useState(null)

  const max = items.reduce((peak, item) => Math.max(peak, item.value), 0) || 1
  const height = items.length * ROW_HEIGHT
  const colorAt = (index) => (Array.isArray(colors) ? colors[index] : colors)

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          {items.map((item, index) => {
            const top = index * ROW_HEIGHT
            const barTop = top + ROW_HEIGHT - BAR_THICKNESS - 8
            const barWidth = (item.value / max) * width

            return (
              <g
                key={item.id}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              >
                <rect x="0" y={top} width={width} height={ROW_HEIGHT} fill="transparent" />

                <text
                  x="0"
                  y={top + 12}
                  className="text-[12px]"
                  style={{ fill: 'var(--ink-2)' }}
                >
                  {item.name}
                </text>
                <text
                  x={width}
                  y={top + 12}
                  textAnchor="end"
                  className="text-[12px] font-medium tabular-nums"
                  style={{ fill: 'var(--ink-1)' }}
                >
                  {formatValue(item.value)}
                </text>

                <g style={{ opacity: active === null || active === index ? 1 : 0.45 }}>
                  <path
                    d={barPath(0, barTop, width, BAR_THICKNESS, MARK.barRadius, 'right')}
                    style={{ fill: 'var(--surface-2)' }}
                  />
                  <path
                    d={barPath(0, barTop, barWidth, BAR_THICKNESS, MARK.barRadius, 'right')}
                    style={{ fill: colorAt(index) }}
                  />
                </g>
              </g>
            )
          })}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {active !== null ? (
        <Tooltip
          x={Math.min(width * 0.5, width - 20)}
          y={active * ROW_HEIGHT + ROW_HEIGHT / 2}
          width={width}
          {...buildTooltip(items[active], active)}
        />
      ) : null}
    </div>
  )
}
