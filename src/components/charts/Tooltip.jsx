export function Tooltip({ x, y, width, title, rows, footer }) {
  const flip = x > width - 150
  const style = {
    left: x,
    top: y,
    transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
  }

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[178px] rounded-lg border border-line bg-surface-1 px-3 py-2 shadow-pop"
      style={style}
    >
      <p className="text-[12px] font-medium text-ink-1">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-2">
              {row.color ? (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              {row.name}
            </span>
            <span className="font-medium tabular-nums text-ink-1">{row.value}</span>
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-1.5 border-t border-line pt-1.5 text-[11px] text-ink-3">{footer}</p> : null}
    </div>
  )
}
