export function Card({ className = '', children, ...rest }) {
  return (
    <section
      className={`rounded-card border border-line bg-surface-1 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-5 pt-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-tight text-ink-1">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
