import { Card, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { IconCheck, IconChevronRight } from '../Icons'
import { formatMinutesAgo } from '../../lib/format'
import { useTranslation } from '../../i18n/context'

const LIMIT = 8

/**
 * The session's actions, newest first.
 *
 * `limit` is what separates the two panels this is: a dashboard card shows a
 * recent handful and stops, while the bell's panel is given `null` and holds
 * the lot — a panel that scrolls has no reason to hide rows behind an edge
 * the reader cannot see. `onViewMore` is offered only where the activity page
 * behind it can actually be opened, so the caller decides, not this.
 *
 * `newSince` is a read watermark: entries logged after it are marked new.
 * Left out — as the dashboard card leaves it — nothing is marked, since a
 * card sitting on a screen the reader is already looking at has no unread.
 *
 * `onMarkAllRead` moves that watermark, and is offered on the same terms as
 * `onViewMore`: given a handler the footer grows a button, otherwise it does
 * without one. It goes live exactly when a row is marked new, so the button
 * and the marks it clears say the same thing.
 */
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

      {/* Only the list scrolls: the header names the panel and the footer
          leaves it, and neither should slide out from under the reader.
          `min-h-0` is what lets this shrink inside the flex column rather
          than pushing the card past the height it was given — without it a
          flex item floors at its content and the card grows instead. */}
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
          {/* Left in place rather than pulled once there is nothing left to
              mark: the button vanishing from under the pointer it was just
              clicked with would take "View more" up with it. */}
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
