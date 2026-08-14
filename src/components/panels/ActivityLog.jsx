import { Card, CardHeader } from '../ui/Card'
import { formatMinutesAgo } from '../../lib/format'
import { useTranslation } from '../../i18n/context'

const LIMIT = 8

export function ActivityLog({ entries, className = '' }) {
  const { t } = useTranslation()
  const rows = entries.slice(0, LIMIT)

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader title={t('activity.title')} subtitle={t('activity.subtitle')} />

      <ol className="mt-2 px-5 pb-4">
        {rows.map((entry, index) => (
          <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < rows.length - 1 ? (
              <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-line" />
            ) : null}
            <span
              aria-hidden="true"
              className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface-1 bg-surface-3"
            />
            <div className="min-w-0 text-[13px]">
              <p className="font-medium text-ink-1">{t(entry.messageKey)}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
                {entry.name} · {entry.sku} ·{' '}
                {formatMinutesAgo(Math.max(0, Math.round((Date.now() - entry.at) / 60_000)))}
              </p>
              {entry.reason ? (
                <p className="mt-0.5 truncate text-[11.5px] italic text-ink-3">
                  “{entry.reason}”
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">{t('activity.empty')}</p>
      ) : null}
    </Card>
  )
}
