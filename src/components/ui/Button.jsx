const VARIANTS = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'border border-line bg-surface-1 text-ink-2 hover:bg-surface-2 hover:text-ink-1',
  danger: 'border border-line bg-surface-1 text-ink-2 hover:bg-surface-2',
  destructive: 'text-white hover:opacity-90',
  dangerText: 'hover:bg-surface-2',
}

const STYLES = {
  destructive: { backgroundColor: 'var(--status-critical)' },
  dangerText: { color: 'var(--status-critical)' },
}

const SIZES = {
  md: 'h-9 gap-1.5 px-3 text-[13px]',
  sm: 'h-7 gap-1 px-2.5 text-[12px]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      style={STYLES[variant]}
      className={`flex items-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface-1 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
