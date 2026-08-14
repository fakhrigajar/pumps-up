import { Card } from '../components/ui/Card'
import { useTranslation } from '../i18n/context'

export function ModulePlaceholder({ label, Icon }) {
  const { t } = useTranslation()

  return (
    <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
        {Icon ? <Icon className="h-6 w-6" /> : null}
      </span>
      <h2 className="mt-4 text-[17px] font-semibold text-ink-1">{label}</h2>
      <p className="mt-1.5 max-w-sm text-[13.5px] text-ink-2">
        {t('module.body', { module: label })}
      </p>
    </Card>
  )
}
