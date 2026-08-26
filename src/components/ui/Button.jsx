import { IconSpinner } from '../Icons'

/** The variant's own colors, without the hover — a button that is working
 *  keeps its color but stops reacting to the pointer. */
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

/**
 * One flat look for every unavailable button, rather than a faded copy of the
 * enabled one. A filled variant dimmed to 45% leaves white text over a pale
 * wash of its own color, and the blanket `disabled:hover:bg-surface-1` this
 * replaces went further: hovering a disabled primary swapped the fill for the
 * page surface and left the white label on top of it, invisible.
 */
const DISABLED = 'cursor-not-allowed border border-line bg-surface-2 text-ink-3'

const SIZES = {
  md: 'h-9 gap-1.5 px-3 text-[13px]',
  sm: 'h-7 gap-1 px-2.5 text-[12px]',
}

/**
 * `pending` is a third state rather than a flavour of `disabled`: both refuse
 * a click, but one is a button with nothing to do and the other is a button
 * mid-request. Keeping the variant's color under the spinner is what says
 * which — grey would read as the action having switched itself off.
 */
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
