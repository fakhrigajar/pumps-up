import { IconCard, IconCash } from '../Icons'
import { useTranslation } from '../../i18n/context'

export function PaymentTag({ method }) {
  const { t } = useTranslation()
  const Icon = method === 'card' ? IconCard : IconCash
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-ink-1">
      <Icon className="h-3.5 w-3.5 text-ink-3" />
      {t(`sales.${method}`)}
    </span>
  )
}
