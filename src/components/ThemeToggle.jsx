import { useTheme } from '../theme/context'
import { IconMoon, IconSun } from './Icons'
import { useTranslation } from '../i18n/context'

const OPTIONS = [
  { id: 'light', labelKey: 'theme.light', Icon: IconSun },
  { id: 'dark', labelKey: 'theme.dark', Icon: IconMoon },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map(({ id, labelKey, Icon }) => {
        const active = theme === id
        const label = t(labelKey)
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={t('theme.tip', { name: label })}
            onClick={() => setTheme(id)}
            className={`rounded-[6px] p-1.5 transition-colors ${
              active ? 'bg-surface-1 text-ink-1 shadow-card' : 'text-ink-3 hover:text-ink-1'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
