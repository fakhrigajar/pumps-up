import { Card, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { IconCheck, IconChevronRight } from '../Icons'
import { formatMinutesAgo } from '../../lib/format'
import { useTranslation } from '../../i18n/context'

const LIMIT = 8

export function ActivityLog({
  entries,
  className = '',
  limit = LIMIT,
  onViewMore,
  onMarkAllRead,
  newSince = null,
}) {
  const { t } = useTranslation()
  const rows = limit === null ? entries : entries.slice(0, limit)
  const isNew = (entry) => newSince !== null && entry.at > newSince
  const hasNew = rows.some(isNew)

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader
        title={t('activity.title')}
        subtitle={t('activity.subtitle')}
        className="shrink-0"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ol className="mt-2 px-5 pb-4">
          {rows.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < rows.length - 1 ? (
                <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-line" />
              ) : null}
              <span
                aria-hidden="true"
                className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface-1 ${
                  isNew(entry) ? 'bg-accent' : 'bg-surface-3'
                }`}
              />
              <div className="min-w-0 text-[13px]">
                <p className="font-medium text-ink-1">
                  {t(entry.messageKey)}
                  {isNew(entry) ? (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold uppercase leading-[1.6] tracking-wide text-ink-1">
                      {t('activity.new')}
                    </span>
                  ) : null}
                </p>
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
      </div>

      {onMarkAllRead || onViewMore ? (
        <div className="shrink-0 space-y-2 border-t border-line p-3">
          {onMarkAllRead ? (
            <Button
              size="sm"
              onClick={onMarkAllRead}
              disabled={!hasNew}
              className="w-full justify-center"
            >
              <IconCheck className="h-3.5 w-3.5" />
              {t('activity.markAllRead')}
            </Button>
          ) : null}

          {onViewMore ? (
            <Button size="sm" onClick={onViewMore} className="w-full justify-center">
              {t('activity.viewMore')}
              <IconChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
