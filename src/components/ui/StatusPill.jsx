import { IconAlert, IconCheck } from '../Icons'

const TONES = {
  good: { color: 'var(--status-good)', Icon: IconCheck },
  warning: { color: 'var(--status-warning)', Icon: IconAlert },
  serious: { color: 'var(--status-serious)', Icon: IconAlert },
  critical: { color: 'var(--status-critical)', Icon: IconAlert },
  neutral: { color: 'var(--ink-3)', Icon: null },
}

export function StatusPill({ tone = 'neutral', children }) {
  const { color, Icon } = TONES[tone] ?? TONES.neutral

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-ink-1">
      {Icon ? (
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      ) : (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  )
}
