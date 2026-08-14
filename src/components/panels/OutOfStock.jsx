import { Card, CardHeader } from '../ui/Card'
import { StatusPill } from '../ui/StatusPill'
import { selectOutOfStock } from '../../data/erp'
import { useTranslation } from '../../i18n/context'

export function OutOfStock({ products }) {
  const { t } = useTranslation()
  const rows = selectOutOfStock(products)

  return (
    <Card className="flex flex-col">
      <CardHeader title={t('repl.title')} subtitle={t('repl.subtitle')} />

      <ul className="mt-1 divide-y divide-line">
        {rows.map((item) => (
          <li key={item.sku} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink-1">{item.name}</p>
              <p className="text-[11.5px] tabular-nums text-ink-3">
                {item.sku} · {t(`category.${item.category}`)}
              </p>
            </div>
            <StatusPill tone="critical">{t('repl.outOfStock')}</StatusPill>
          </li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">{t('repl.empty')}</p>
      ) : null}
    </Card>
  )
}
