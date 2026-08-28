import { IconSpinner } from '../Icons'

const VARIANTS = {
  primary: 'bg-accent text-white',
  secondary: 'border border-line bg-surface-1 text-ink-2',
  danger: 'border border-line bg-surface-1 text-ink-2',
  destructive: 'text-white',
  dangerText: '',
  warning: '',
}

const HOVERS = {
  primary: 'hover:opacity-90',
  secondary: 'hover:bg-surface-2 hover:text-ink-1',
  danger: 'hover:bg-surface-2',
  destructive: 'hover:opacity-90',
  dangerText: 'hover:bg-surface-2',
  warning: 'hover:opacity-90',
}

const STYLES = {
  destructive: { backgroundColor: 'var(--status-critical)' },
  dangerText: { color: 'var(--status-critical)' },
  warning: { backgroundColor: 'var(--status-warning)', color: 'var(--on-status)' },
}

const DISABLED = 'cursor-not-allowed border border-line bg-surface-2 text-ink-3'

const SIZES = {
  md: 'h-9 gap-1.5 px-3 text-[13px]',
  sm: 'h-7 gap-1 px-2.5 text-[12px]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  pending = false,
  children,
  ...rest
}) {
  const state = pending ? 'pending' : disabled ? 'disabled' : 'idle'

  return (
    <button
      type={type}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      style={state === 'disabled' ? undefined : STYLES[variant]}
      className={`flex items-center rounded-lg font-medium transition-colors ${SIZES[size]} ${
        state === 'disabled'
          ? DISABLED
          : `${VARIANTS[variant]} ${state === 'pending' ? 'cursor-progress' : HOVERS[variant]}`
      } ${className}`}
      {...rest}
    >
      {pending ? (
        <IconSpinner className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : null}
      {children}
    </button>
  )
}
