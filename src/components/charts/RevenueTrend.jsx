import { useMemo, useState } from 'react'
import { useMeasure } from '../../lib/useMeasure'
import { formatCurrency, formatCurrencyCompact, niceTicks } from '../../lib/format'
import { useTranslation } from '../../i18n/context'
import { areaPath, axisGutter, labelStride, linePath } from './shapes'
import { CHROME, MARK, SERIES } from './tokens'
import { Tooltip } from './Tooltip'

const PLOT_HEIGHT = 232
const AXIS_BAND = 24
const PAD = { top: 10, bottom: 8 }

export function RevenueTrend({ rows }) {
  const { t } = useTranslation()
  const [ref, width] = useMeasure()
  const [active, setActive] = useState(null)

  const height = PLOT_HEIGHT + AXIS_BAND
  const innerHeight = PLOT_HEIGHT - PAD.top - PAD.bottom

  const scale = useMemo(() => {
    const peak = rows.reduce((max, row) => Math.max(max, row.revenue), 0)
    return niceTicks(peak, 4)
  }, [rows])

  const last = rows[rows.length - 1]
  const tickLabel = (tick) => (tick === 0 ? '0' : formatCurrencyCompact(tick))
  const endLabel = formatCurrencyCompact(last.revenue)

  const padLeft = axisGutter(scale.ticks.map(tickLabel))
  const padRight = axisGutter([endLabel], 40, 20)
  const innerWidth = Math.max(0, width - padLeft - padRight)

  const xAt = (index) =>
    padLeft + (rows.length <= 1 ? innerWidth / 2 : (index / (rows.length - 1)) * innerWidth)
  const yAt = (value) => PAD.top + innerHeight - (value / scale.max) * innerHeight

  const points = rows.map((row, index) => ({ x: xAt(index), y: yAt(row.revenue) }))
  const baseline = PAD.top + innerHeight
  const stride = labelStride(rows.length, innerWidth, 26)

  const activeRow = active === null ? null : rows[active]

  function handleMove(event) {
    if (!innerWidth || rows.length === 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - bounds.left - PAD.left
    const ratio = rows.length <= 1 ? 0 : position / innerWidth
    const index = Math.round(ratio * (rows.length - 1))
    setActive(Math.min(rows.length - 1, Math.max(0, index)))
  }

  function handleKey(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setActive((current) => {
      const next = (current ?? rows.length - 1) + (event.key === 'ArrowRight' ? 1 : -1)
      return Math.min(rows.length - 1, Math.max(0, next))
    })
  }

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={t('revenue.aria', { count: rows.length })}
          tabIndex={0}
          onMouseMove={handleMove}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(rows.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKey}
          className="block outline-none"
        >
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={padLeft + innerWidth}
                y1={yAt(tick)}
                y2={yAt(tick)}
                strokeWidth="1"
                style={{ stroke: tick === 0 ? CHROME.axis : CHROME.grid }}
                shapeRendering="crispEdges"
              />
              <text
                x={padLeft - 10}
                y={yAt(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[11px] tabular-nums"
                style={{ fill: CHROME.muted }}
              >
                {tickLabel(tick)}
              </text>
            </g>
          ))}

          <path d={areaPath(points, baseline)} style={{ fill: SERIES[0], opacity: MARK.areaOpacity }} />
          <path
            d={linePath(points)}
            fill="none"
            strokeWidth={MARK.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: SERIES[0] }}
          />

          {activeRow ? (
            <line
              x1={xAt(active)}
              x2={xAt(active)}
              y1={PAD.top}
              y2={baseline}
              strokeWidth="1"
              style={{ stroke: CHROME.axis }}
              shapeRendering="crispEdges"
            />
          ) : null}

          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={MARK.dotRadius}
            strokeWidth="2"
            style={{ fill: SERIES[0], stroke: CHROME.surface }}
          />

          {activeRow ? (
            <circle
              cx={xAt(active)}
              cy={yAt(activeRow.revenue)}
              r={MARK.dotRadius}
              strokeWidth="2"
              style={{ fill: SERIES[0], stroke: CHROME.surface }}
            />
          ) : null}

          <text
            x={points[points.length - 1].x + 10}
            y={points[points.length - 1].y}
            dominantBaseline="middle"
            className="text-[12px] font-medium"
            style={{ fill: 'var(--ink-1)' }}
          >
            {endLabel}
          </text>

          {rows.map((row, index) =>
            index % stride === 0 || index === rows.length - 1 ? (
              <text
                key={row.key}
                x={xAt(index)}
                y={PLOT_HEIGHT + 14}
                textAnchor="middle"
                className="text-[11px]"
                style={{ fill: CHROME.muted }}
              >
                {row.label}
              </text>
            ) : null,
          )}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {activeRow ? (
        <Tooltip
          x={xAt(active)}
          y={yAt(activeRow.revenue)}
          width={width}
          title={activeRow.tooltipLabel}
          rows={[{ name: t('revenue.revenue'), value: formatCurrency(activeRow.revenue), color: SERIES[0] }]}
        />
      ) : null}
    </div>
  )
}
