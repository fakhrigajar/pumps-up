import { LogoMark } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageMenu'
import { ActivityBell } from './ActivityBell'
import { IconMenu } from './Icons'
import { useTranslation } from '../i18n/context'

export function Topbar({
  title,
  onOpenNav,
  activityLog,
  unreadActivity,
  onActivityRead,
  onViewActivity,
}) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface-1 px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        className="-ml-1.5 rounded-lg p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink-1 lg:hidden"
      >
        <IconMenu />
        <span className="sr-only">{t('nav.open')}</span>
      </button>

      <LogoMark className="h-5 w-auto text-ink-1 lg:hidden" />

      <h1 className="hidden text-[15px] font-semibold text-ink-1 lg:block">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <ActivityBell
          entries={activityLog}
          unread={unreadActivity}
          onRead={onActivityRead}
          onViewMore={onViewActivity}
        />
        <LanguageMenu />
        <ThemeToggle />
      </div>
    </header>
  )
}
