
export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)']

export const ORDINAL = [
  'var(--ordinal-1)',
  'var(--ordinal-2)',
  'var(--ordinal-3)',
  'var(--ordinal-4)',
  'var(--ordinal-5)',
]

export const CHROME = {
  grid: 'var(--line)',
  axis: 'var(--axis)',
  muted: 'var(--ink-3)',
  surface: 'var(--surface-1)',
}

export const STATUS = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
}

export function ordinalScale(count) {
  if (count <= 1) return [ORDINAL[2]]
  const span = Math.min(count, ORDINAL.length)
  return Array.from({ length: count }, (_, index) => {
    const position = Math.round((index / (count - 1)) * (span - 1))
    return ORDINAL[Math.min(ORDINAL.length - 1, position)]
  })
}

export const MARK = {
  barMaxThickness: 24,
  barRadius: 4,
  lineWidth: 2,
  dotRadius: 4,
  surfaceGap: 2,
  areaOpacity: 0.1,
}
