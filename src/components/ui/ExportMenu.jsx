import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconDownload, IconFilePdf, IconFileSheet } from '../Icons'
import { exportPdf, exportXlsx } from '../../lib/exporters'
import { useTranslation } from '../../i18n/context'

const FORMATS = [
  { id: 'pdf', labelKey: 'rep.exportPdf', Icon: IconFilePdf, run: exportPdf },
  { id: 'xlsx', labelKey: 'rep.exportExcel', Icon: IconFileSheet, run: exportXlsx },
]

export function ExportMenu({ buildDoc, disabled }) {
  const { t } = useTranslation()
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={disabled ? t('rep.exportEmpty') : undefined}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface-1"
      >
        <IconDownload className="h-4 w-4" />
        {t('rep.export')}
        <IconChevronDown className="h-4 w-4 text-ink-3" />
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label={t('rep.export')}
          className="absolute right-0 top-full z-30 mt-1.5 min-w-[168px] overflow-hidden rounded-lg border border-line bg-surface-1 py-1 shadow-pop"
        >
          {FORMATS.map(({ id, labelKey, Icon, run }) => (
            <li key={id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  run(buildDoc())
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink-1"
              >
                <Icon className="h-4 w-4 text-ink-3" />
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
