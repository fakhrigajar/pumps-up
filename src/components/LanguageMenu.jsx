import { useEffect, useRef, useState } from 'react'
import { LANGUAGES, useTranslation } from '../i18n/context'
import { IconCheck, IconChevronDown, IconGlobe } from './Icons'

export function LanguageMenu() {
  const { language, setLanguage, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = LANGUAGES.find((item) => item.id === language) ?? LANGUAGES[0]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('lang.label')}
        className="flex h-9 items-center gap-1 rounded-lg border border-line bg-surface-2 pl-2 pr-1.5 text-[13px] font-medium text-ink-2 hover:text-ink-1"
      >
        <IconGlobe className="h-4 w-4" />
        <span className="tabular-nums">{active.short}</span>
        <IconChevronDown className="h-4 w-4 text-ink-3" />
        <span className="sr-only">{t('lang.label')}</span>
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label={t('lang.label')}
          className="absolute right-0 top-full z-30 mt-1.5 min-w-[172px] overflow-hidden rounded-lg border border-line bg-surface-1 py-1 shadow-pop"
        >
          {LANGUAGES.map((item) => {
            const selected = item.id === language
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setLanguage(item.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface-2 ${
                    selected ? 'font-medium text-ink-1' : 'text-ink-2'
                  }`}
                >
                  <span className="w-4 shrink-0 text-accent">
                    {selected ? <IconCheck className="h-4 w-4" /> : null}
                  </span>
                  {item.name}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
