export function Legend({ items, className = '' }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <Swatch shape={item.shape} color={item.color} dashed={item.dashed} />
          <span>{item.name}</span>
        </li>
      ))}
    </ul>
  )
}

function Swatch({ shape = 'swatch', color, dashed }) {
  if (shape === 'line') {
    return (
      <svg width="14" height="10" aria-hidden="true" className="shrink-0">
        <line
          x1="0"
          y1="5"
          x2="14"
          y2="5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={dashed ? '3 3' : undefined}
          style={{ stroke: color }}
        />
      </svg>
    )
  }
  return (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 shrink-0 rounded-sm"
      style={{ backgroundColor: color }}
    />
  )
}
