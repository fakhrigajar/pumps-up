import { Card } from './ui/Card'
import { IconArrowDown, IconArrowUp } from './Icons'
import { formatDelta, formatValue } from '../lib/format'
import { useMeasure } from '../lib/useMeasure'
import { linePath } from './charts/shapes'
import { CHROME, MARK, SERIES } from './charts/tokens'
import { useTranslation } from '../i18n/context'

export function StatTile({ label, value, format, delta, deltaUnit, upIsGood, spark, note }) {
  const { t } = useTranslation()
  const isFlat = Math.abs(delta) < 0.05
  const isGood = delta > 0 === upIsGood
  const Arrow = delta >= 0 ? IconArrowUp : IconArrowDown

  return (
    <Card className="p-4">
      <p className="text-[13px] text-ink-2">{label}</p>

      <div className="mt-1.5 flex items-end justify-between gap-3">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-ink-1">
          {formatValue(value, format)}
        </p>
        <Sparkline values={spark} />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {isFlat ? (
          <span className="text-[12px] font-medium text-ink-2">{t('kpi.noChange')}</span>
        ) : (
          <span
            className="flex items-center gap-0.5 text-[12px] font-medium"
            style={{ color: isGood ? 'var(--delta-up)' : 'var(--delta-down)' }}
          >
            <Arrow className="h-3.5 w-3.5" />
            {formatDelta(delta, deltaUnit)}
          </span>
        )}
        <span className="text-[12px] text-ink-3">{note}</span>
      </div>
    </Card>
  )
}

function Sparkline({ values }) {
  const [ref, width] = useMeasure()
  const height = 34

  if (!values?.length) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const inset = 5
  const points = values.map((value, index) => ({
    x: inset + (index / (values.length - 1 || 1)) * Math.max(0, width - inset * 2),
    y: height - inset - ((value - min) / span) * (height - inset * 2),
  }))
  const tail = points.slice(-2)

  return (
    <div ref={ref} className="h-[34px] w-[92px] shrink-0" aria-hidden="true">
      {width > 0 ? (
        <svg width={width} height={height} className="block overflow-visible">
          <path
            d={linePath(points)}
            fill="none"
            strokeWidth={MARK.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: CHROME.muted, opacity: 0.55 }}
          />
          <path
            d={linePath(tail)}
            fill="none"
            strokeWidth={MARK.lineWidth}
            strokeLinecap="round"
            style={{ stroke: SERIES[0] }}
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            strokeWidth="2"
            style={{ fill: SERIES[0], stroke: CHROME.surface }}
          />
        </svg>
      ) : null}
    </div>
  )
}
