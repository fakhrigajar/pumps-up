export function barPath(x, y, width, height, radius, side = 'top') {
  const w = Math.max(0, width)
  const h = Math.max(0, height)
  if (w === 0 || h === 0) return ''
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))

  if (side === 'right') {
    return [
      `M${x},${y}`,
      `H${x + w - r}`,
      `A${r},${r} 0 0 1 ${x + w},${y + r}`,
      `V${y + h - r}`,
      `A${r},${r} 0 0 1 ${x + w - r},${y + h}`,
      `H${x}`,
      'Z',
    ].join(' ')
  }

  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${x + w - r}`,
    `A${r},${r} 0 0 1 ${x + w},${y + r}`,
    `V${y + h}`,
    'Z',
  ].join(' ')
}

export function linePath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
}

export function areaPath(points, baseline) {
  if (!points.length) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath(points)} L${last.x},${baseline} L${first.x},${baseline} Z`
}

const CHAR_WIDTH = 6.2

export function axisGutter(labels, minimum = 44, gap = 14) {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0)
  return Math.max(minimum, Math.ceil(longest * CHAR_WIDTH + gap))
}

export function labelStride(count, available, minSpacing = 44) {
  if (count <= 1 || available <= 0) return 1
  const perLabel = available / count
  return Math.max(1, Math.ceil(minSpacing / perLabel))
}
